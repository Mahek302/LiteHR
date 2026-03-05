import { TfiVideoClapper } from "react-icons/tfi";
import { FaCalendarTimes } from "react-icons/fa";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../images/WFE_logo.png";
import hero1 from "../images/hero2.jpg";
import hero2 from "../images/hero3.jpg";
import hero3 from "../images/hero6.jpg";
import careersBanner from "../images/hero5.jpg";
import team1 from "../images/DK.png";
import team2 from "../images/Bhavika.png";
import team3 from "../images/Mahek.png";
import team4 from "../images/Abhi.png";
import {
  Menu, X, Clock, Calendar, BarChart3,
  ChevronRight, LogIn, Users, Play, 
  Briefcase, Home, Zap, CheckCircle, ArrowRight, Sun, Moon,
  Sparkles, Rocket, Shield, Globe, Star, Heart, Award,
  TrendingUp, Coffee, Gift, ZapOff, XCircle, Video, UserPlus,
  Linkedin, Github, Mail
} from "lucide-react";
import { FiUserPlus, FiUserCheck } from "react-icons/fi";
import { BiSolidArrowToTop } from "react-icons/bi";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import jobService from "../services/jobService";
import Chatbot from "../components/Chatbot";
import demoRequestService from "../services/demoRequestService";



// Enhanced DotGrid with particle effects and better performance
const EnhancedDotGrid = ({
  dotSize = 3,
  gap = 16,
  baseColor = "#1E1B2B",
  activeColor = "#8B5CF6",
  hoverColor = "#10B981",
  proximity = 150,
  particleCount = 50
}) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const particlesRef = useRef([]);
  const animationRef = useRef(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  // Initialize particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateDimensions = () => {
      const { width, height } = canvas.parentElement.getBoundingClientRect();
      dimensionsRef.current = { width, height };
      canvas.width = width;
      canvas.height = height;
      
      // Create particle grid
      const cols = Math.floor(width / (dotSize + gap)) + 4;
      const rows = Math.floor(height / (dotSize + gap)) + 4;
      const particles = [];
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          particles.push({
            x: col * (dotSize + gap) + (Math.random() * 2 - 1),
            y: row * (dotSize + gap) + (Math.random() * 2 - 1),
            baseX: col * (dotSize + gap),
            baseY: row * (dotSize + gap),
            size: dotSize * (0.8 + Math.random() * 0.4),
            phase: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random() * 2,
            color: baseColor
          });
        }
      }
      particlesRef.current = particles;
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(canvas.parentElement);

    return () => resizeObserver.disconnect();
  }, [dotSize, gap, baseColor]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      time += 0.02;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const { width, height } = dimensionsRef.current;
      const mouse = mouseRef.current;
      
      particlesRef.current.forEach(particle => {
        // Calculate distance from mouse
        const dx = particle.baseX - mouse.x;
        const dy = particle.baseY - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Natural floating motion
        const floatX = Math.sin(time * particle.speed + particle.phase) * 2;
        const floatY = Math.cos(time * particle.speed + particle.phase) * 2;
        
        let targetX = particle.baseX + floatX;
        let targetY = particle.baseY + floatY;
        
        // Mouse interaction
        if (mouse.active && distance < proximity) {
          const force = (1 - distance / proximity) * 15;
          const angle = Math.atan2(dy, dx);
          
          // Push particles away from mouse
          targetX += Math.cos(angle) * force;
          targetY += Math.sin(angle) * force;
          
          // Color transition based on distance
          const colorIntensity = 1 - distance / proximity;
          if (distance < proximity / 3) {
            particle.color = hoverColor;
          } else if (distance < proximity / 2) {
            particle.color = activeColor;
          } else {
            particle.color = baseColor;
          }
        } else {
          // Gradually return to base color
          if (particle.color !== baseColor) {
            particle.color = baseColor;
          }
        }
        
        // Smooth movement
        particle.x += (targetX - particle.x) * 0.1;
        particle.y += (targetY - particle.y) * 0.1;
        
        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
        
        // Add glow effect
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = mouse.active && distance < proximity / 2 ? 15 : 5;
        
        ctx.fillStyle = particle.color;
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Draw connecting lines for nearby particles (creates web effect)
        if (mouse.active && distance < proximity / 2) {
          particlesRef.current.forEach(otherParticle => {
            const otherDx = particle.x - otherParticle.x;
            const otherDy = particle.y - otherParticle.y;
            const otherDistance = Math.sqrt(otherDx * otherDx + otherDy * otherDy);
            
            if (otherDistance < 50 && otherDistance > 0) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = `${activeColor}${Math.floor((1 - otherDistance / 50) * 50).toString(16).padStart(2, '0')}`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          });
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [proximity, activeColor, hoverColor, baseColor]);

  // Mouse event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000, active: false };
    };

    canvas.parentElement.addEventListener('mousemove', handleMouseMove);
    canvas.parentElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.parentElement.removeEventListener('mousemove', handleMouseMove);
      canvas.parentElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
};

// Floating particles component for additional effects
const FloatingParticles = ({ count = 20, color = "#8B5CF6" }) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 10 + Math.random() * 20,
    delay: Math.random() * 5
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
            filter: `blur(${particle.size / 2}px)`,
            opacity: 0.3
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// Glowing orb component
const GlowingOrb = ({ color, size, position, delay = 0 }) => {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${color}80, transparent 70%)`,
        left: position.x,
        top: position.y,
        filter: 'blur(40px)',
        zIndex: 0
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3],
        x: [0, 30, 0],
        y: [0, -30, 0]
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
};

// Demo Modal Component
const DemoModal = ({ isOpen, onClose, currentTheme, isDarkTheme }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
    companyWebsite: '',
    role: '',
    employees: '',
    interests: []
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleInterestChange = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!formData.interests.length) {
      setSubmitError("Please select at least one reason for using LiteHR.");
      return;
    }

    try {
      setIsSubmitting(true);
      await demoRequestService.submit(formData);
      setShowSuccess(true);

      // Reset form after showing success
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        setFormData({
          fullName: '',
          email: '',
          companyName: '',
          companyWebsite: '',
          role: '',
          employees: '',
          interests: []
        });
      }, 3000);
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message ||
          "Unable to submit your request right now. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          backgroundColor: currentTheme.card,
          borderColor: currentTheme.border
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          style={{ color: currentTheme.text.primary }}
        >
          <XCircle size={24} />
        </button>

        <div className="p-8">
          <h2 className="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-purple-500 to-green-500 bg-clip-text text-transparent">
            Book a Personalized LiteHR Demo
          </h2>
          <p className="text-center mb-8" style={{ color: currentTheme.text.muted }}>
            Experience how LiteHR can transform your HR operations
          </p>


          {/* Demo Request Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.text.primary }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  style={{
                    backgroundColor: isDarkTheme ? '#1E293B' : '#F8FAFC',
                    borderColor: currentTheme.border,
                    color: currentTheme.text.primary
                  }}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.text.primary }}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  style={{
                    backgroundColor: isDarkTheme ? '#1E293B' : '#F8FAFC',
                    borderColor: currentTheme.border,
                    color: currentTheme.text.primary
                  }}
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.text.primary }}>Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  style={{
                    backgroundColor: isDarkTheme ? '#1E293B' : '#F8FAFC',
                    borderColor: currentTheme.border,
                    color: currentTheme.text.primary
                  }}
                  placeholder="KN Industries"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.text.primary }}>Company Website</label>
                <input
                  type="url"
                  value={formData.companyWebsite}
                  onChange={(e) => setFormData({...formData, companyWebsite: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  style={{
                    backgroundColor: isDarkTheme ? '#1E293B' : '#F8FAFC',
                    borderColor: currentTheme.border,
                    color: currentTheme.text.primary
                  }}
                  placeholder="https://knindustries.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.text.primary }}>Role/Position *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  style={{
                    backgroundColor: isDarkTheme ? '#1E293B' : '#F8FAFC',
                    borderColor: currentTheme.border,
                    color: currentTheme.text.primary
                  }}
                >
                  <option value="">Select Role</option>
                  <option value="HR">HR Manager</option>
                  <option value="Manager">Department Manager</option>
                  <option value="Admin">System Admin</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.text.primary }}>Number of Employees *</label>
                <select
                  required
                  value={formData.employees}
                  onChange={(e) => setFormData({...formData, employees: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  style={{
                    backgroundColor: isDarkTheme ? '#1E293B' : '#F8FAFC',
                    borderColor: currentTheme.border,
                    color: currentTheme.text.primary
                  }}
                >
                  <option value="">Select Range</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="10-30">10-30 employees</option>
                  <option value="30-50">30-50 employees</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: currentTheme.text.primary }}>Why do you want to use LiteHR? *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'attendance', label: 'Attendance', icon: Calendar, color: 'purple' },
                  { value: 'leave', label: 'Leave Management', icon: FaCalendarTimes, color: 'green' },
                  { value: 'worklogs', label: 'Worklogs', icon: BarChart3, color: 'blue' },
                  { value: 'employee', label: 'Employee Management', icon: Users, color: 'orange' }
                ].map((interest) => {
                  const Icon = interest.icon;
                  const isSelected = formData.interests.includes(interest.value);
                  const colorHex = interest.color === 'purple'
                    ? '#8B5CF6'
                    : interest.color === 'green'
                      ? '#10B981'
                      : interest.color === 'blue'
                        ? '#3B82F6'
                        : '#F97316';
                  return (
                    <motion.button
                      key={interest.value}
                      type="button"
                      onClick={() => handleInterestChange(interest.value)}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        isSelected ? `border-${interest.color}-500 bg-${interest.color}-500/10` : ''
                      }`}
                      style={{
                        borderColor: isSelected ? colorHex : currentTheme.border,
                        backgroundColor: isSelected ? (isDarkTheme ? '#1E293B' : '#F8FAFC') : 'transparent'
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon size={24} style={{ color: isSelected ? colorHex : (isDarkTheme ? '#E2E8F0' : currentTheme.text.primary) }} />
                      <span className="text-sm" style={{ color: currentTheme.text.primary }}>{interest.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {submitError && (
              <p className="text-sm text-red-500">{submitError}</p>
            )}

            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-green-600 text-white rounded-xl font-semibold text-lg relative overflow-hidden group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{isSubmitting ? "Submitting..." : "Book Demo"}</span>
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </motion.button>
          </form>

          {/* LiteHR Info */}
          <div className="mt-8 p-6 rounded-xl border" style={{ borderColor: currentTheme.border, backgroundColor: isDarkTheme ? '#0F172A' : '#F1F5F9' }}>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="text-purple-500" size={20} />
              Why LiteHR?
            </h4>
            <p className="text-sm" style={{ color: currentTheme.text.secondary }}>
              LiteHR is a lightweight, full-stack HR solution designed specifically for small organizations and startups with 10-30 employees. 
              Replace spreadsheets with automated attendance tracking, leave management, worklogs, and employee records. 
              Our system features AI-powered resume summarization, intelligent leave collision detection, and a smart chatbot for instant HR support.
            </p>
          </div>
        </div>

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="p-8 rounded-2xl text-center max-w-md"
                style={{ backgroundColor: currentTheme.card }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <CheckCircle size={40} className="text-green-500" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">Form Submitted Successfully! 🎉</h3>
                <p className="text-sm" style={{ color: currentTheme.text.muted }}>
                  Once approved, we will email your 15-day trial activation link to this login email.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// Team Member Card Component
const TeamMemberCard = ({ name, role, image, color, index, currentTheme }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="text-center group"
    >
      <div className="relative mb-4">
        <div className={`relative w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-${color}-500/30 group-hover:border-${color}-500 transition-all duration-300`}>
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className={`absolute inset-0 bg-gradient-to-t from-${color}-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        </div>
      </div>
      
      <h4 className="font-semibold text-lg">{name}</h4>
      <p className="text-sm" style={{ color: currentTheme.text.muted }}>{role}</p>
    </motion.div>
  );
};

export default function Homepage() {
  const navigate = useNavigate();
  const slides = [hero1, hero2, hero3];
  const [index, setIndex] = useState(0);
  const [menu, setMenu] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [videoModal, setVideoModal] = useState({ open: false, src: "" });
  const [jobs, setJobs] = useState([]);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  
  // Parallax effects
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Theme colors based on current theme
  const theme = {
    dark: {
      background: '#0F172A',
      card: '#1E293B',
      cardHover: '#334155',
      border: '#334155',
      text: {
        primary: '#F1F5F9',
        secondary: '#CBD5E1',
        muted: '#94A3B8',
        disabled: '#64748B'
      }
    },
    light: {
      background: '#F8FAFC',
      card: '#FFFFFF',
      cardHover: '#F1F5F9',
      border: '#E5E7EB',
      text: {
        primary: '#111827',
        secondary: '#374151',
        muted: '#6B7280',
        disabled: '#9CA3AF'
      }
    }
  };

  const currentTheme = isDarkTheme ? theme.dark : theme.light;

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== null) {
      setIsDarkTheme(savedTheme === 'dark');
    }
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    document.body.style.backgroundColor = currentTheme.background;
    document.body.style.color = currentTheme.text.primary;
  }, [isDarkTheme, currentTheme]);

  // Track mouse position for effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-slide for hero images
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await jobService.getPublicJobs();
        if (Array.isArray(data)) {
          setJobs(data.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to load jobs", error);
      }
    };
    fetchJobs();
  }, []);

  // Video mapping for features
  const featureVideos = {
    0: "attendance1.mp4",
    1: "leaves.mp4",
    2: "worklog.mp4"
  };

  // Navigation handlers
  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleCareersClick = () => {
    scrollToSection('careers');
  };

  const handleDemoClick = () => {
    setDemoModalOpen(true);
  };

  const handleGetStarted = () => {
    const modulesSection = document.getElementById('modules');
    if (modulesSection) {
      const headerOffset = 80;
      const elementPosition = modulesSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openVideoModal = (videoSrc) => {
    setVideoModal({ open: true, src: videoSrc });
  };

  const closeVideoModal = () => {
    setVideoModal({ open: false, src: "" });
  };

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
  };

  // Feature data
  const featureDetails = [
    {
      title: "Attendance System",
      howItWorks: "Employees can clock in/out with a single click, view their attendance history, and request shift changes. Managers receive instant notifications for attendance exceptions.",
      benefits: [
        "Real-time updates and notifications",
        "Mobile-friendly interface",
        "Automated reporting",
        "Role-based access control",
        "Geolocation support",
        "Custom shift configurations"
      ],
      icon: <Clock />,
      color: "#8B5CF6"
    },
    {
      title: "Leave Management",
      howItWorks: "Submit leave requests, track balances, and get automated approvals. Managers can approve or reject requests with comments. All leave types are supported.",
      benefits: [
        "Automated approval workflows",
        "Leave balance tracking",
        "Multi-level approvals",
        "Calendar integration",
        "Policy compliance checks",
        "Historical data analysis"
      ],
      icon: <Calendar />,
      color: "#10B981"
    },
    {
      title: "Work Log Analytics",
      howItWorks: "Log daily tasks, track project progress, and generate productivity reports. Managers can monitor team performance and identify bottlenecks.",
      benefits: [
        "Productivity insights",
        "Project progress tracking",
        "Team performance metrics",
        "Custom report generation",
        "Time allocation analytics",
        "Goal achievement tracking"
      ],
      icon: <BarChart3 />,
      color: "#3B82F6"
    }
  ];

  // Handle scroll to section with header offset
  const scrollToSection = (sectionId) => {
    if (sectionId === 'home') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <>
      {/* Video Modal with enhanced animation */}
      <AnimatePresence>
        {videoModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-xl"
            onClick={closeVideoModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="relative w-full max-w-4xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeVideoModal}
                className="absolute top-4 right-4 z-10 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-sm border border-white/20"
              >
                <X size={24} />
              </button>
              <div className="p-2">
                <video
                  src={videoModal.src}
                  controls
                  autoPlay
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
              </div>
              <div className="p-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm">
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                  <Play size={20} className="text-purple-400" />
                  Tutorial Preview
                </h3>
                <p className="text-gray-300 text-sm">Experience the power of LiteHR in action</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Modal */}
      <AnimatePresence>
        {demoModalOpen && (
          <DemoModal 
            isOpen={demoModalOpen} 
            onClose={() => setDemoModalOpen(false)} 
            currentTheme={currentTheme}
            isDarkTheme={isDarkTheme}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen overflow-x-hidden transition-colors duration-500 relative"
           style={{
              backgroundColor: currentTheme.background,
             color: currentTheme.text.primary
            }}>
        
        {/* Background effects */}
        <GlowingOrb color="#8B5CF6" size="300px" position={{ x: '10%', y: '20%' }} delay={0} />
        <GlowingOrb color="#10B981" size="250px" position={{ x: '80%', y: '60%' }} delay={2} />
        <GlowingOrb color="#3B82F6" size="200px" position={{ x: '50%', y: '80%' }} delay={4} />
        <FloatingParticles count={30} color="#8B5CF6" />

        {/* ============= NAVBAR ============= */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="fixed top-0 left-0 w-full h-16 backdrop-blur-xl flex items-center justify-between z-50 px-6 md:px-20 border-b"
          style={{
             backgroundColor: `${isDarkTheme ? '#0F172A' : '#F8FAFC'}CC`,
            borderColor: currentTheme.border,
            color: currentTheme.text.primary
          }}
        >
          {/* Logo with hover animation */}
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.98 }}
          >
            <img
              src={logo}
              alt="LiteHR"
              className="h-12 w-auto object-contain"
              style={{ filter: !isDarkTheme ? 'brightness(0) saturate(100%) invert(27%) sepia(78%) saturate(2000%) hue-rotate(240deg)' : 'none' }}
            />
          </motion.div>

          {/* Desktop nav with hover effects */}
          <nav className="hidden sm:flex gap-8 text-sm tracking-wide">
            {[
              { name: "Home", action: () => scrollToSection('home') },
              { name: "About Us", action: () => scrollToSection('about') },
              { name: "Features", action: () => scrollToSection('features') },
              { name: "Careers", action: () => scrollToSection('careers') }
            ].map((item, i) => (
              <motion.button
                key={i}
                onClick={item.action}
                className="relative group"
                whileHover={{ y: -2 }}
                style={{ color: currentTheme.text.secondary }}
              >
                {item.name}
                <motion.span
                  className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-green-500 group-hover:w-full transition-all duration-300"
                  whileHover={{ width: '100%' }}
                />
              </motion.button>
            ))}
          </nav>

          {/* Theme Toggle and Login Button */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors duration-300 relative overflow-hidden"
              style={{
                 backgroundColor: isDarkTheme ? '#1E293B' : '#E5E7EB',
                color: isDarkTheme ? '#F1F5F9' : '#111827'
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Toggle theme"
            >
              <motion.div
                animate={{ rotate: isDarkTheme ? 0 : 180 }}
                transition={{ duration: 0.5 }}
              >
                {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
              </motion.div>
            </motion.button>

            <motion.button
              onClick={handleLoginClick}
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-600 px-5 py-2 text-sm rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2 text-white relative overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogIn size={16} />
              <span>Login</span>
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </motion.button>

            <motion.button
              onClick={() => setMenu(!menu)}
              className="sm:hidden p-2 rounded-lg hover:bg-[#1E293B] transition"
              style={{ color: currentTheme.text.primary }}
              whileTap={{ scale: 0.9 }}
            >
              {menu ? <X size={22} /> : <Menu size={22} />}
            </motion.button>
          </div>
        </motion.header>

        {/* MOBILE MENU with animation */}
        <AnimatePresence>
          {menu && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-16 left-0 w-full p-6 sm:hidden z-40 border-b backdrop-blur-xl"
              style={{
                 backgroundColor: `${isDarkTheme ? '#0F172A' : '#F8FAFC'}F2`,
                borderColor: currentTheme.border
              }}
            >
              <div className="flex flex-col gap-2">
                {[
                  { icon: <Home size={16} />, name: "Home", action: () => { scrollToSection('home'); setMenu(false); } },
                  { icon: <Users size={16} />, name: "About Us", action: () => { scrollToSection('about'); setMenu(false); } },
                  { icon: <Zap size={16} />, name: "Features", action: () => { scrollToSection('features'); setMenu(false); } },
                  { icon: <TfiVideoClapper size={16} />, name: "Book Demo", action: () => { handleDemoClick(); setMenu(false); } },
                  { icon: <Briefcase size={16} />, name: "Careers", action: () => { scrollToSection('careers'); setMenu(false); } }
                ].map((item, i) => (
                  <motion.button
                    key={i}
                    onClick={item.action}
                    className="py-3 px-4 rounded-lg flex items-center gap-3 transition-all hover:bg-white/10"
                    style={{ color: currentTheme.text.secondary }}
                    whileHover={{ x: 10 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {item.icon}
                    {item.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============= HERO SECTION ============= */}
        <section
          id="home"
          ref={heroRef}
          className="pt-24 md:pt-28 pb-20 px-6 md:px-20 flex flex-col md:flex-row items-center gap-16 relative overflow-hidden min-h-screen"
          style={{
             background: isDarkTheme
               ? 'radial-gradient(circle at 50% 50%, #1E1B2B, #020617)'
              : 'radial-gradient(circle at 50% 50%, #FFFFFF, #F8FAFC)'
          }}
        >
          {/* Enhanced Animated Background */}
          <EnhancedDotGrid
            dotSize={3}
            gap={16}
            baseColor={isDarkTheme ? "#271E37" : "#E0E7FF"}
            activeColor="#8B5CF6"
            hoverColor="#10B981"
            proximity={200}
          />

          {/* TEXT with animations */}
          <motion.div
             className="flex-1 relative z-20"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            style={{ y: heroY }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-green-500/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6 border border-purple-500/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <Zap size={14} className="text-purple-500" />
              <span className="bg-gradient-to-r from-purple-500 to-green-500 bg-clip-text text-transparent font-medium">
                Streamlined HR Operations
              </span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles size={14} className="text-green-500" />
              </motion.div>
            </motion.div>

            <motion.h1
               className="text-5xl md:text-6xl font-bold leading-tight mb-6 tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Internal HR Automation{" "}
              <motion.span
                 className="bg-gradient-to-r from-purple-500 via-purple-500 to-green-500 bg-clip-text text-transparent inline-block"
                animate={{
                   backgroundPosition: ['0%', '100%', '0%'],
                }}
                transition={{ duration: 10, repeat: Infinity }}
                style={{ backgroundSize: '200%' }}
              >
                Made Simple
              </motion.span>
            </motion.h1>

            <motion.p
               className="text-lg md:text-xl max-w-xl mb-10 leading-relaxed backdrop-blur-sm p-6 rounded-2xl"
              style={{
                 backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                color: currentTheme.text.secondary
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              A modern internal system designed for employees, managers & admins to
              digitally manage attendance, leaves, work logs, and team activity —
              without using spreadsheets.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
               className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-500 hover:to-green-500 text-white px-8 py-4 rounded-xl font-medium flex items-center gap-3 transition-all duration-300 shadow-2xl relative overflow-hidden group"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px -10px rgba(139, 92, 246, 0.5)' }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Get Started</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronRight size={20} />
                </motion.div>
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.5 }}
                />
              </motion.button>

              <motion.button
                onClick={handleDemoClick}
                className="bg-transparent border-2 border-purple-500 text-purple-500 hover:bg-purple-500/10 px-8 py-4 rounded-xl font-medium flex items-center gap-3 transition-all duration-300 relative overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <TfiVideoClapper size={20} />
                <span>Book Demo</span>
              </motion.button>

              <motion.button
                onClick={() => scrollToSection('careers')}
                className="bg-transparent border-2 border-green-500 text-green-500 hover:bg-green-500/10 px-8 py-4 rounded-xl font-medium flex items-center gap-3 transition-all duration-300 relative overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Briefcase size={20} />
                <span>Careers</span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* IMAGE SLIDER with 3D effect */}
          <motion.div
             className="flex-1 w-full max-w-2xl relative z-20"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ y: heroY }}
          >
            <motion.div
               className="relative rounded-2xl shadow-2xl transition-all duration-500 transform-gpu"
              style={{
                transformStyle: 'preserve-3d',
                perspective: '1000px',
              }}
              whileHover={{ rotateY: 5, rotateX: 5 }}
              animate={{
                y: [0, -10, 0],
              }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              <motion.img
                key={index}
                src={slides[index]}
                className="w-full h-[320px] md:h-[430px] rounded-2xl object-cover border-[6px] transition-all duration-500"
                style={{ borderColor: currentTheme.border }}
                alt="HR Management Dashboard"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
              />

              {/* Slide Indicators with animation */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {slides.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300`}
                    style={{
                      width: i === index ? 32 : 8,
                      backgroundColor: i === index ? '#8B5CF6' : currentTheme.border
                    }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ============= ABOUT US SECTION ============= */}
        <motion.section
           id="about"
           className="py-32 px-6 md:px-20 relative overflow-hidden"
          style={{ backgroundColor: currentTheme.background }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <GlowingOrb color="#8B5CF6" size="400px" position={{ x: '70%', y: '30%' }} delay={1} />
          
          <div className="relative z-10 max-w-6xl mx-auto">
            <motion.div
               className="text-center mb-20"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-green-500/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-purple-500/30"
                whileHover={{ scale: 1.05 }}
              >
                <Rocket size={16} className="text-purple-500" />
                <span className="text-lg">About LiteHR</span>
              </motion.div>
              
              <h2 className="text-6xl md:text-5xl font-bold mb-6">
                Redefining{" "}
                <span className="bg-gradient-to-r from-purple-500 via-purple-500 to-green-500 bg-clip-text text-transparent">
                  HR Excellence
                </span>
              </h2>
              
              <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-green-500 mx-auto rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <motion.div
                className="p-8 rounded-2xl border backdrop-blur-sm relative overflow-hidden group"
                style={{
                   backgroundColor: currentTheme.card,
                  borderColor: currentTheme.border
                 }}
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.8 }}
                />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
                    <Rocket size={24} className="text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                  <p className="text-lg leading-relaxed" style={{ color: currentTheme.text.secondary }}>
                    To revolutionize HR management by providing intuitive, automated solutions that free organizations 
                    from manual processes and spreadsheets, enabling them to focus on what truly matters - their people.
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="p-8 rounded-2xl border backdrop-blur-sm relative overflow-hidden group"
                style={{
                   backgroundColor: currentTheme.card,
                  borderColor: currentTheme.border
                 }}
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.8 }}
                />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                    <Globe size={24} className="text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                  <p className="text-lg leading-relaxed" style={{ color: currentTheme.text.secondary }}>
                    To become the leading internal HR automation platform for small to medium teams,
                     setting new standards for efficiency, user experience, and data-driven decision making.
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="p-8 rounded-6xl border backdrop-blur-sm relative overflow-hidden group mb-16"
              style={{
                 backgroundColor: currentTheme.card,
                borderColor: currentTheme.border
               }}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -10 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-3xl font-bold mb-4 flex items-center gap-2">
                    <Award className="text-purple-500" />
                    Why Choose LiteHR?
                  </h3>
                  <p className="text-lg leading-relaxed" style={{ color: currentTheme.text.secondary }}>
                    LiteHR is a digitized internal HR solution aimed to replace spreadsheets and provide real-time attendance,
                     approval workflows, and consolidated reporting for small teams. Our platform streamlines HR processes while
                     maintaining data security and compliance.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: <Shield />, label: "Enterprise Security" },
                    { icon: <Zap />, label: "Lightning Fast" },
                    { icon: <Heart />, label: "User Love" },
                    { icon: <TrendingUp />, label: "Scalable" }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="p-4 rounded-xl text-center"
                      style={{ backgroundColor: isDarkTheme ? '#0F172A' : '#F1F5F9' }}
                      whileHover={{ scale: 1.05, backgroundColor: '#8B5CF6' }}
                    >
                      <div className="text-2xl mb-2 text-purple-500 group-hover:text-white">
                        {item.icon}
                      </div>
                      <div className="text-sm">{item.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: "100%", label: "Secure", color: "from-purple-500 to-pink-500", icon: <Shield /> },
                { value: "24/7", label: "Availability", color: "from-green-500 to-teal-500", icon: <Clock /> },
                { value: "99.9%", label: "Uptime", color: "from-blue-500 to-cyan-500", icon: <TrendingUp /> },
                { value: "0", label: "Spreadsheets", color: "from-orange-500 to-yellow-500", icon: <ZapOff /> }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  className="text-center p-6 rounded-xl border backdrop-blur-sm"
                  style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  whileHover={{ y: -10, scale: 1.05 }}
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-sm" style={{ color: currentTheme.text.muted }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ============= TEAM SECTION ============= */}
        <motion.section
           className="py-32 px-6 md:px-20 relative overflow-hidden"
          style={{ backgroundColor: isDarkTheme ? '#0F172A' : '#F1F5F9' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <GlowingOrb color="#10B981" size="350px" position={{ x: '80%', y: '30%' }} delay={2} />
          
          <div className="relative z-10 max-w-6xl mx-auto">
            <motion.div
               className="text-center mb-16"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-green-500/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-purple-500/30"
                whileHover={{ scale: 1.05 }}
              >
                <Users size={16} className="text-purple-500" />
                <span className="text-sm">Our Team</span>
              </motion.div>
              
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                Meet The{" "}
                <span className="bg-gradient-to-r from-purple-500 to-green-500 bg-clip-text text-transparent">
                  Minds Behind LiteHR
                </span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg" style={{ color: currentTheme.text.muted }}>
                Passionate developers and designers creating the future of HR management
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <TeamMemberCard
                name="Dhanashree Khambal"
                role="Full Stack Developer"
                image={team1}
                color="purple"
                index={0}
                currentTheme={currentTheme}
              />
              <TeamMemberCard
                name="Bhavika Dhakate"
                role="Full Stack Developer"
                image={team2}
                color="pink"
                index={1}
                currentTheme={currentTheme}
              />
              <TeamMemberCard
                name="Mahek Sanghavi"
                role="Full Stack Developer"
                image={team3}
                color="blue"
                index={2}
                currentTheme={currentTheme}
              />
              <TeamMemberCard
                name="Abhi Mistry"
                role="Full Stack Developer"
                image={team4}
                color="green"
                index={3}
                currentTheme={currentTheme}
              />
            </div>
          </div>
        </motion.section>

        {/* ============= FEATURES ============= */}
        <motion.section
           id="features"
           className="py-32 px-6 md:px-20 relative overflow-hidden"
          style={{ backgroundColor: isDarkTheme ? '#0F172A' : '#F1F5F9' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <GlowingOrb color="#10B981" size="350px" position={{ x: '20%', y: '70%' }} delay={2} />
          
          <div className="relative z-10">
            <motion.div
               className="text-center mb-20"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-green-500/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-purple-500/30"
                whileHover={{ scale: 1.05 }}
              >
                <Star size={16} className="text-purple-500" />
                <span className="text-sm">Powerful Features</span>
              </motion.div>
              
              <h2 className=" text-5xl md:text-6xl font-bold mb-6">
                Everything,{" "}
                <span className="bg-gradient-to-r from-purple-500 to-green-500 bg-clip-text text-transparent">
                  You Need
                </span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg" style={{ color: currentTheme.text.muted }}>
                Experience seamless HR management with our intuitive features
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featureDetails.map((feature, idx) => (
                <FeatureCard
                  key={idx}
                  index={idx}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.desc}
                  isActive={activeFeature === idx}
                  onClick={() => setActiveFeature(idx)}
                  featureDetail={feature}
                  videoSrc={featureVideos[idx]}
                  onVideoClick={() => openVideoModal(featureVideos[idx])}
                  currentTheme={currentTheme}
                  isDarkTheme={isDarkTheme}
                />
              ))}
            </div>
          </div>
        </motion.section>

        {/* ============= MODULES ============= */}
        <motion.section
           id="modules"
           className="py-32 px-6 md:px-20 relative overflow-hidden"
          style={{
             background: isDarkTheme
               ? 'linear-gradient(135deg, #0F172A, #1E293B)'
              : 'linear-gradient(135deg, #F8FAFC, #FFFFFF)'
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <GlowingOrb color="#3B82F6" size="400px" position={{ x: '80%', y: '40%' }} delay={3} />
          
          <div className="relative z-10">
            <motion.div
               className="text-center mb-20"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-green-500/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-purple-500/30"
                whileHover={{ scale: 1.05 }}
              >
                <Users size={16} className="text-purple-500" />
                <span className="text-sm">Role-Based Access</span>
              </motion.div>
              
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                Tailored{" "}
                <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                  Experiences
                </span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg" style={{ color: currentTheme.text.muted }}>
                Different interfaces designed for different roles
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ModuleCard
                title="Employee Portal"
                items={[
                  "Attendance (IN/OUT)",
                  "Leave Requests",
                  "Daily Work Summaries",
                  "Attendance History"
                ]}
                icon={<Users />}
                color="purple"
                currentTheme={currentTheme}
                isDarkTheme={isDarkTheme}
                index={0}
              />

              <ModuleCard
                title="Manager Portal"
                items={[
                  "Approve Attendance",
                  "Approve Leaves",
                  "Monitor Team Work Logs",
                  "Team Overview & Analytics"
                ]}
                icon={<FiUserPlus />}
                color="green"
                currentTheme={currentTheme}
                isDarkTheme={isDarkTheme}
                index={1}
              />

              <ModuleCard
                title="Admin Portal"
                items={[
                  "Employee Master Records",
                  "Role & Department Setup",
                  "Leave Policies",
                  "Full HR Reporting"
                ]}
                icon={<FiUserCheck />}
                color="blue"
                currentTheme={currentTheme}
                isDarkTheme={isDarkTheme}
                index={2}
              />
            </div>
          </div>
        </motion.section>

        {/* ============= CAREERS BANNER ============= */}
        <motion.section
           id="careers"
           className="py-20 px-6 md:px-20 relative"
          style={{ backgroundColor: currentTheme.background }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <motion.div
            onClick={() => window.location.href = '/careers'}
            className="relative rounded-3xl overflow-hidden cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Gradient Overlay */}
            <motion.div
               className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-black/50 to-green-900/90 z-10"
              animate={{
                background: [
                  'linear-gradient(90deg, rgba(139,92,246,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(16,185,129,0.9) 100%)',
                  'linear-gradient(90deg, rgba(16,185,129,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(139,92,246,0.9) 100%)',
                  'linear-gradient(90deg, rgba(139,92,246,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(16,185,129,0.9) 100%)',
                ]
              }}
              transition={{ duration: 10, repeat: Infinity }}
            />

            {/* Image with parallax */}
            <motion.img
              src={careersBanner}
              alt="Join Our Team"
              className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-110"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 20, repeat: Infinity }}
            />

            {/* Content */}
            <motion.div
               className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <motion.div
                 className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full mb-8 border border-white/30"
                whileHover={{ scale: 1.05 }}
                animate={{ boxShadow: ['0 0 20px rgba(139,92,246,0.3)', '0 0 40px rgba(16,185,129,0.3)', '0 0 20px rgba(139,92,246,0.3)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Briefcase size={20} className="text-white" />
                <span className="text-white font-medium">We're Hiring</span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles size={16} className="text-yellow-300" />
                </motion.div>
              </motion.div>

              <motion.h2
                 className="text-5xl md:text-5xl font-bold text-white mb-6"
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
              >
                Join Our{" "}
                <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-green-300 bg-clip-text text-transparent">
                  Growing Team
                </span>
              </motion.h2>

              <motion.p
                 className="text-xl text-white/90 max-w-2xl mb-10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Help us build the future of HR technology. Explore opportunities to grow your career.
              </motion.p>

              <motion.div
                 className="flex items-center gap-4 bg-white/20 backdrop-blur-xl px-8 py-4 rounded-full hover:bg-white/30 transition-all duration-300"
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255,255,255,0.3)' }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-white font-semibold text-lg">View Careers</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight size={24} className="text-white" />
                </motion.div>
              </motion.div>

              {/* Floating elements */}
              <motion.div
                className="absolute top-10 left-10 w-20 h-20 rounded-full bg-purple-500/20 backdrop-blur-xl flex items-center justify-center"
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 360],
                }}
                transition={{ duration: 10, repeat: Infinity }}
              >
                <Rocket size={30} className="text-white" />
              </motion.div>

              <motion.div
                className="absolute bottom-10 right-10 w-16 h-16 rounded-full bg-green-500/20 backdrop-blur-xl flex items-center justify-center"
                animate={{
                  y: [0, 20, 0],
                  rotate: [360, 0],
                }}
                transition={{ duration: 8, repeat: Infinity }}
              >
                <Gift size={24} className="text-white" />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* ============= LEGAL SECTION ============= */}
        <motion.section
           className="py-20 px-6 md:px-20 relative"
          style={{ backgroundColor: isDarkTheme ? '#0F172A' : '#F1F5F9' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.h2
               className="text-3xl md:text-4xl font-bold text-center mb-12"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              Legal &{" "}
              <span className="bg-gradient-to-r from-purple-500 to-green-500 bg-clip-text text-transparent">
                Compliance
              </span>
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Privacy Policy",
                  description: "We are committed to protecting your privacy. Your personal information is securely stored and never shared with third parties without your explicit consent. We comply with GDPR and data protection regulations.",
                  icon: <Shield />,
                  color: "purple"
                },
                {
                  title: "Terms & Conditions",
                  description: "By using LiteHR, you agree to our terms of service. We provide the platform as-is with continuous improvements. Users are responsible for maintaining the confidentiality of their accounts.",
                  icon: <Award />,
                  color: "green"
                },
                {
                  title: "Data Protection",
                  description: "Your data is encrypted both in transit and at rest. We implement industry-standard security measures, regular backups, and access controls to ensure your information remains safe.",
                  icon: <Lock />,
                  color: "blue"
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  className="p-8 rounded-2xl border backdrop-blur-sm relative overflow-hidden group"
                  style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                  <div className={`w-14 h-14 rounded-full bg-${item.color}-500/20 flex items-center justify-center mb-6`}>
                    <div className={`text-${item.color}-500 text-2xl`}>{item.icon}</div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: currentTheme.text.muted }}>
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* PREMIUM FOOTER */}
        <motion.footer
           className="w-full py-8 border-t relative overflow-hidden"
          style={{
             backgroundColor: isDarkTheme ? '#020617' : '#F8FAFC',
            borderColor: currentTheme.border
           }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <FloatingParticles count={10} color="#8B5CF6" />
          
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/")}
              whileHover={{ opacity: 0.8 }}
              whileTap={{ scale: 0.98 }}
            >
                <img
                  src={logo}
                  alt="LiteHR"
                  className="h-15 w-auto object-contain"
                  style={{ filter: !isDarkTheme ? 'brightness(0) saturate(100%) invert(27%) sepia(78%) saturate(2000%) hue-rotate(240deg)' : 'none' }}
                />
            </motion.div>

              <motion.p
                 className="text-sm text-center"
                style={{ color: currentTheme.text.muted }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Internal HR Automation System • © 2025
              </motion.p>

              <div className="w-24" /> {/* Spacer for alignment */}
            </div>
          </div>
        </motion.footer>
      </div>

      {/* Scroll to Top Button (Above Chatbot) */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="fixed right-6 z-[150] flex items-center justify-center w-12 h-12 rounded-full shadow-2xl bg-gradient-to-r from-purple-600 to-green-600 text-white hover:from-purple-500 hover:to-green-500 transition-all duration-300"
            style={{ bottom: 'calc(80px + 1rem)' }} // Positioned above chatbot
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <BiSolidArrowToTop size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <Chatbot
        endpoint="/api/chatbot/public-ask"
        welcomeMessage={`👋 Welcome to LiteHR!\nAsk me anything about attendance, leave management, hiring, or HR workflows.\nI’m here to help 😊`}
        title="LiteHR Assistant"
        subtitle="FAQs & Support"
      />
    </>
  );
}

// Enhanced FeatureCard Component
function FeatureCard({ index, icon, title, description, isActive, onClick, featureDetail, videoSrc, onVideoClick, currentTheme, isDarkTheme }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      whileHover={{ y: -10 }}
      className="relative group"
    >
      <motion.div
        onClick={onClick}
        className={`
          relative rounded-2xl p-8 text-left transition-all duration-300 border cursor-pointer
          ${isActive ? 'shadow-2xl' : 'shadow-lg'}
          overflow-hidden
        `}
        style={{
           backgroundColor: currentTheme.card,
          borderColor: isActive ? '#8B5CF6' : currentTheme.border,
          boxShadow: isActive ? '0 25px 50px -12px rgba(139, 92, 246, 0.5)' : undefined
        }}
        animate={isActive ? {
          scale: [1, 1.02, 1],
        } : {}}
        transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${featureDetail.color}20, transparent 70%)`,
          }}
          animate={isActive ? {
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Floating Icon */}
        <motion.div
          className={`relative w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg`}
          style={{
            backgroundColor: isActive ? `${featureDetail.color}30` : isDarkTheme ? '#1E293B' : '#F1F5F9',
            color: isActive ? featureDetail.color : currentTheme.text.muted
          }}
          animate={isActive ? {
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1],
          } : {}}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {React.cloneElement(icon, { size: 28 })}
        </motion.div>

        <h3 className="text-2xl font-semibold mb-3" style={{ color: currentTheme.text.primary }}>
          {title}
        </h3>
        <p className="text-sm mb-6" style={{ color: currentTheme.text.muted }}>{description}</p>

        {/* How It Works */}
        <div className="mb-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-green-500" />
            How It Works
          </h4>
          <p className="text-sm" style={{ color: currentTheme.text.secondary }}>
            {featureDetail.howItWorks}
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500" />
            Key Benefits
          </h4>
          <ul className="space-y-2">
            {featureDetail.benefits.slice(0, 3).map((benefit, idx) => (
              <motion.li
                key={idx}
                className="flex items-start gap-2 text-sm"
                style={{ color: currentTheme.text.secondary }}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>{benefit}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Watch Tutorial Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onVideoClick();
          }}
          className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-600 rounded-xl transition-all duration-300 text-white font-medium relative overflow-hidden group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Play size={18} />
          <span>Watch Tutorial</span>
          <motion.div
            className="absolute inset-0 bg-white/20"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.5 }}
          />
        </motion.button>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            className="absolute top-4 right-4 w-3 h-3 rounded-full bg-green-500"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

// Enhanced ModuleCard Component
function ModuleCard({ title, items, icon, color, currentTheme, isDarkTheme, index }) {
  const colorMap = {
    purple: { bg: '#8B5CF6', light: '#EDE9FE' },
    green: { bg: '#10B981', light: '#D1FAE5' },
    blue: { bg: '#3B82F6', light: '#DBEAFE' }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      whileHover={{ y: -10 }}
      className="relative group"
    >
      <div className="relative rounded-2xl p-8 shadow-xl border overflow-hidden"
           style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}>
        
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${colorMap[color].bg}20, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />

        {/* Icon with animation */}
        <motion.div
          className={`relative w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg`}
          style={{
            backgroundColor: `${colorMap[color].bg}20`,
            color: colorMap[color].bg
          }}
          animate={{
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, delay: index * 0.5 }}
        >
          {React.cloneElement(icon, { size: 32 })}
        </motion.div>

        <h3 className="text-2xl font-bold mb-6">{title}</h3>

        <ul className="space-y-4">
          {items.map((item, idx) => (
            <motion.li
              key={idx}
              className="flex items-center gap-3"
              style={{ color: currentTheme.text.secondary }}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <motion.div
                className={`w-2 h-2 rounded-full`}
                style={{ backgroundColor: colorMap[color].bg }}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
              />
              <span>{item}</span>
            </motion.li>
          ))}
        </ul>

        {/* Decorative elements */}
        <motion.div
          className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-20"
          style={{ backgroundColor: colorMap[color].bg }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
}

// Missing Lock icon import
const Lock = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);
