import { useRef, useEffect } from "react";
import { Renderer, Camera, Transform, Plane, Program, Mesh, Texture } from "ogl";
import "./FlyingPosters.css";

const vertexShader = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

uniform float uPosition;
uniform float uTime;
uniform float uSpeed;
uniform vec3 distortionAxis;
uniform vec3 rotationAxis;
uniform float uDistortion;

varying vec2 vUv;
varying vec3 vNormal;

float PI = 3.141592653589793238;
mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat4(
      oc * axis.x * axis.x + c,         oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
      oc * axis.x * axis.y + axis.z * s,oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
      oc * axis.z * axis.x - axis.y * s,oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
      0.0,                              0.0,                                0.0,                                1.0
    );
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
  mat4 m = rotationMatrix(axis, angle);
  return (m * vec4(v, 1.0)).xyz;
}

float qinticInOut(float t) {
  return t < 0.5
    ? 16.0 * pow(t, 5.0)
    : -0.5 * abs(pow(2.0 * t - 2.0, 5.0)) + 1.0;
}

void main() {
  vUv = uv;

  float norm = 0.5;
  vec3 newpos = position;
  float offset = (dot(distortionAxis, position) + norm / 2.0) / norm;
  float shifted = clamp(uPosition + (offset - 0.5) * (0.08 * uDistortion), 0.0, 1.0);
  float localprogress = shifted;
  localprogress = qinticInOut(localprogress) * PI;
  newpos = rotate(newpos, rotationAxis, localprogress);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newpos, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform vec2 uImageSize;
uniform vec2 uPlaneSize;
uniform sampler2D tMap;

varying vec2 vUv;

void main() {
  vec2 imageSize = uImageSize;
  vec2 planeSize = uPlaneSize;

  float imageAspect = imageSize.x / imageSize.y;
  float planeAspect = planeSize.x / planeSize.y;
  vec2 scale = vec2(1.0, 1.0);

  if (planeAspect > imageAspect) {
      scale.x = imageAspect / planeAspect;
  } else {
      scale.y = planeAspect / imageAspect;
  }

  vec2 uv = vUv * scale + (1.0 - scale) * 0.5;
  gl_FragColor = texture2D(tMap, uv);
}
`;

function autoBind(self) {
  const proto = Object.getPrototypeOf(self);
  Object.getOwnPropertyNames(proto).forEach((key) => {
    if (key !== "constructor" && typeof self[key] === "function") {
      self[key] = self[key].bind(self);
    }
  });
}

const lerp = (p1, p2, t) => p1 + (p2 - p1) * t;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const map = (num, min1, max1, min2, max2) => {
  const num1 = (num - min1) / (max1 - min1);
  return num1 * (max2 - min2) + min2;
};

class Media {
  constructor({ gl, geometry, scene, screen, viewport, image, length, index, planeWidth, planeHeight, distortion }) {
    this.extra = 0;
    this.gl = gl;
    this.geometry = geometry;
    this.scene = scene;
    this.screen = screen;
    this.viewport = viewport;
    this.image = image;
    this.length = length;
    this.index = index;
    this.planeWidth = planeWidth;
    this.planeHeight = planeHeight;
    this.distortion = distortion;

    this.createShader();
    this.createMesh();
    this.onResize();
  }

  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: false });

    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      fragment: fragmentShader,
      vertex: vertexShader,
      uniforms: {
        tMap: { value: texture },
        uPosition: { value: 0 },
        uPlaneSize: { value: [0, 0] },
        uImageSize: { value: [0, 0] },
        uSpeed: { value: 0 },
        rotationAxis: { value: [0, 1, 0] },
        distortionAxis: { value: [1, 1, 0] },
        uDistortion: { value: this.distortion },
        uViewportSize: { value: [this.viewport.width, this.viewport.height] },
        uTime: { value: 0 },
      },
      cullFace: false,
    });

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSize.value = [img.naturalWidth, img.naturalHeight];
    };
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program,
    });
    this.plane.setParent(this.scene);
  }

  setScale() {
    this.plane.scale.x = (this.viewport.width * this.planeWidth) / this.screen.width;
    this.plane.scale.y = (this.viewport.height * this.planeHeight) / this.screen.height;
    this.plane.position.x = 0;
    this.plane.program.uniforms.uPlaneSize.value = [this.plane.scale.x, this.plane.scale.y];
  }

  onResize({ screen, viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      this.plane.program.uniforms.uViewportSize.value = [this.viewport.width, this.viewport.height];
    }
    this.setScale();

    this.padding = 5;
    this.height = this.plane.scale.y + this.padding;
    this.heightTotal = this.height * this.length;
    this.y = -this.heightTotal / 2 + (this.index + 0.5) * this.height;
  }

  update(scroll) {
    this.plane.position.y = this.y - scroll.current - this.extra;
    const position = clamp(
      map(this.plane.position.y, this.viewport.height / 2, -this.viewport.height / 2, 0, 1),
      0,
      1
    );

    this.program.uniforms.uPosition.value = position;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = scroll.current;
  }
}

class Canvas {
  constructor({
    container,
    canvas,
    items,
    planeWidth,
    planeHeight,
    distortion,
    scrollEase,
    cameraFov,
    cameraZ,
    onReachEnd
  }) {
    this.container = container;
    this.canvas = canvas;
    this.items = items;
    this.planeWidth = planeWidth;
    this.planeHeight = planeHeight;
    this.distortion = distortion;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.cameraFov = cameraFov;
    this.cameraZ = cameraZ;
    this.isDown = false;
    this.onReachEnd = onReachEnd;
    this.reachedEndOnce = false;

    autoBind(this);

    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias();
    this.update();
    this.addEventListeners();
  }

  createRenderer() {
    this.renderer = new Renderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio, 2),
    });
    this.gl = this.renderer.gl;
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = this.cameraFov;
    this.camera.position.z = this.cameraZ;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 1,
      widthSegments: 100,
    });
  }

  createMedias() {
    this.medias = this.items.map((image, index) => {
      return new Media({
        gl: this.gl,
        geometry: this.planeGeometry,
        scene: this.scene,
        screen: this.screen,
        viewport: this.viewport,
        image,
        length: this.items.length,
        index,
        planeWidth: this.planeWidth,
        planeHeight: this.planeHeight,
        distortion: this.distortion,
      });
    });

    if (this.medias.length > 0) {
      const first = this.medias[0];
      const last = this.medias[this.medias.length - 1];
      const contentMin = Math.min(first.y, last.y);
      const contentMax = Math.max(first.y, last.y);
      // Expand by half viewport so each card enters from top (normal) and exits at bottom (mirrored)
      this.minScroll = contentMin - this.viewport.height * 0.5;
      this.maxScroll = contentMax + this.viewport.height * 0.5;
      this.scroll.current = this.minScroll;
      this.scroll.target = this.minScroll;
      this.scroll.last = this.minScroll;
    } else {
      this.minScroll = 0;
      this.maxScroll = 0;
    }
  }

  onResize() {
    const rect = this.container.getBoundingClientRect();
    this.screen = { width: rect.width, height: rect.height };
    this.renderer.setSize(this.screen.width, this.screen.height);

    this.camera.perspective({
      aspect: this.gl.canvas.width / this.gl.canvas.height,
    });

    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { height, width };

    if (this.medias) {
      this.medias.forEach((media) => media.onResize({ screen: this.screen, viewport: this.viewport }));
    }
  }

  onTouchDown(e) {
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = e.touches ? e.touches[0].clientY : e.clientY;
  }

  onTouchMove(e) {
    if (!this.isDown) return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const distance = (this.start - y) * 0.1;
    const next = clamp(this.scroll.position + distance, this.minScroll, this.maxScroll);
    const atBottom = this.scroll.target >= this.maxScroll - 0.001;
    if (next === this.scroll.target && atBottom && distance > 0 && !this.reachedEndOnce) {
      this.reachedEndOnce = true;
      this.onReachEnd?.();
    } else {
      this.reachedEndOnce = false;
    }
    this.scroll.target = next;
  }

  onTouchUp() {
    this.isDown = false;
  }

  canConsumeWheel(deltaY) {
    const next = clamp(this.scroll.target + deltaY * 0.005, this.minScroll, this.maxScroll);
    const atBottom = this.scroll.target >= this.maxScroll - 0.001;
    const atTop = this.scroll.target <= this.minScroll + 0.001;
    if (deltaY > 0 && atBottom) return false;
    if (deltaY < 0 && atTop) return false;
    return next !== this.scroll.target;
  }

  onWheel(deltaY) {
    if (!this.canConsumeWheel(deltaY)) {
      if (deltaY > 0 && this.scroll.target >= this.maxScroll - 0.001 && !this.reachedEndOnce) {
        this.reachedEndOnce = true;
        this.onReachEnd?.();
      }
      return false;
    }
    this.reachedEndOnce = false;
    this.scroll.target = clamp(this.scroll.target + deltaY * 0.005, this.minScroll, this.maxScroll);
    return true;
  }

  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    if (this.medias) this.medias.forEach((media) => media.update(this.scroll));
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = requestAnimationFrame(this.update);
  }

  addEventListeners() {
    window.addEventListener("resize", this.onResize);
    window.addEventListener("mousedown", this.onTouchDown);
    window.addEventListener("mousemove", this.onTouchMove);
    window.addEventListener("mouseup", this.onTouchUp);
    window.addEventListener("touchstart", this.onTouchDown);
    window.addEventListener("touchmove", this.onTouchMove);
    window.addEventListener("touchend", this.onTouchUp);
  }

  destroy() {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("mousedown", this.onTouchDown);
    window.removeEventListener("mousemove", this.onTouchMove);
    window.removeEventListener("mouseup", this.onTouchUp);
    window.removeEventListener("touchstart", this.onTouchDown);
    window.removeEventListener("touchmove", this.onTouchMove);
    window.removeEventListener("touchend", this.onTouchUp);
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}

export default function FlyingPosters({
  items = [],
  planeWidth = 320,
  planeHeight = 320,
  distortion = 3,
  scrollEase = 0.01,
  cameraFov = 45,
  cameraZ = 20,
  onReachEnd,
  className = "",
  ...props
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    instanceRef.current = new Canvas({
      container: containerRef.current,
      canvas: canvasRef.current,
      items,
      planeWidth,
      planeHeight,
      distortion,
      scrollEase,
      cameraFov,
      cameraZ,
      onReachEnd,
    });

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }
    };
  }, [items, planeWidth, planeHeight, distortion, scrollEase, cameraFov, cameraZ, onReachEnd]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvasEl = canvasRef.current;

    const handleWheel = (e) => {
      if (!instanceRef.current) return;
      const consumed = instanceRef.current.onWheel(e.deltaY);
      if (consumed) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
    };

    canvasEl.addEventListener("wheel", handleWheel, { passive: false });
    canvasEl.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      canvasEl.removeEventListener("wheel", handleWheel);
      canvasEl.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <div ref={containerRef} className={`posters-container ${className}`.trim()} {...props}>
      <canvas ref={canvasRef} className="posters-canvas" />
    </div>
  );
}
