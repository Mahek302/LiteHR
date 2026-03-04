import ProfileCard from '../components/ProfileCard'; 
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
import modules from "../images/modules.png";
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
import { PiMicrosoftExcelLogoDuotone } from "react-icons/pi";
import iconPattern from "../assets/iconpattern.svg";


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

// Add this new component after the GlowingOrb component
const DigitalArtSection = ({ isDarkTheme, currentTheme }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Abstract Tech Waves */}
      <svg
        className="absolute top-20 left-0 w-full h-64 opacity-20"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
      >
        <path
          d="M0,100 C300,0 600,200 1200,100 L1200,200 L0,200 Z"
          fill="url(#grad1)"
          opacity="0.4"
        >
          <animate
            attributeName="d"
            dur="10s"
            values="M0,100 C300,0 600,200 1200,100 L1200,200 L0,200 Z;
                    M0,150 C300,50 600,250 1200,150 L1200,200 L0,200 Z;
                    M0,100 C300,0 600,200 1200,100 L1200,200 L0,200 Z"
            repeatCount="indefinite"
          />
        </path>
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>

      {/* Digital Circuit Pattern */}
      <div className="absolute top-40 right-10 w-96 h-96 opacity-10">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <pattern id="circuit" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 0 L20 40 M0 20 L40 20" stroke={isDarkTheme ? "#8B5CF6" : "#374151"} strokeWidth="1" fill="none">
              <animate attributeName="stroke-dashoffset" values="0;100;0" dur="20s" repeatCount="indefinite" />
            </path>
            <circle cx="20" cy="20" r="3" fill={isDarkTheme ? "#10B981" : "#059669"} opacity="0.3">
              <animate attributeName="r" values="3;5;3" dur="3s" repeatCount="indefinite" />
            </circle>
          </pattern>
          <rect width="200" height="200" fill="url(#circuit)" />
        </svg>
      </div>

      {/* Floating Geometric Shapes */}
      <motion.div
        className="absolute top-60 left-20 w-32 h-32 rounded-lg bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 backdrop-blur-sm"
        animate={{
          rotate: [0, 45, 0],
          y: [0, -20, 0],
          x: [0, 10, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute bottom-40 right-20 w-40 h-40 rounded-full bg-gradient-to-tr from-green-500/10 to-transparent border border-green-500/20 backdrop-blur-sm"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          x: [0, -30, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Digital Dots Grid */}
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, ' + (isDarkTheme ? '#8B5CF6' : '#374151') + ' 1px, transparent 1px)', backgroundSize: '50px 50px', opacity: 0.1 }} />

      {/* Animated Lines */}
      <svg className="absolute bottom-0 left-0 w-full h-32" preserveAspectRatio="none">
        <path
          d="M0,30 Q150,0 300,30 T600,30 T900,30 T1200,30"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;100"
            dur="20s"
            repeatCount="indefinite"
          />
        </path>
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>

      {/* Data Flow Particles */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-gradient-to-r from-purple-500 to-green-500 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 200 - 100],
            y: [0, Math.random() * 200 - 100],
            opacity: [0, 1, 0],
            scale: [0, 2, 0]
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

// Add this component for the Team Section with Digital Art
const DigitalTeamSection = ({ isDarkTheme, currentTheme }) => {
  return (
    <motion.section
      id="team"
      className="py-32 px-6 md:px-20 relative overflow-hidden"
      style={{ backgroundColor: isDarkTheme ? '#0F172A' : '#F8FAFC' }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      {/* Digital Art Background for Team Section */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Abstract Network Grid */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-10">
          <defs>
            <pattern id="grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke={isDarkTheme ? "#8B5CF6" : "#374151"} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Floating Digital Orbs */}
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
            filter: 'blur(40px)'
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />

        <motion.div
          className="absolute bottom-20 right-20 w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
            filter: 'blur(50px)'
          }}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 18, repeat: Infinity }}
        />

        {/* Digital Connection Lines */}
        <svg className="absolute inset-0 w-full h-full">
          {[...Array(8)].map((_, i) => (
            <motion.line
              key={i}
              x1={`${Math.random() * 100}%`}
              y1={`${Math.random() * 100}%`}
              x2={`${Math.random() * 100}%`}
              y2={`${Math.random() * 100}%`}
              stroke={isDarkTheme ? "#8B5CF6" : "#374151"}
              strokeWidth="1"
              strokeOpacity="0.1"
              strokeDasharray="5,5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
            />
          ))}
        </svg>

        {/* Binary Code Rain Effect */}
        <div className="absolute inset-0 overflow-hidden opacity-5">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-xs font-mono"
              style={{
                left: `${i * 5}%`,
                color: isDarkTheme ? '#8B5CF6' : '#374151',
                writingMode: 'vertical-rl'
              }}
              animate={{
                y: ['-100%', '100%'],
              }}
              transition={{
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "linear"
              }}
            >
              {Array.from({ length: 20 }, () => Math.random() > 0.5 ? '1' : '0').join('')}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Your existing team content goes here */}
      <div className="relative z-10">
        {/* ... existing team section content ... */}
      </div>
    </motion.section>
  );
};

// Demo / Licensing Modal Component
const DemoModal = ({ isOpen, onClose, currentTheme, isDarkTheme, mode = "demo" }) => {
  const getInitialFormData = (activeMode) => ({
    fullName: '',
    email: '',
    companyName: '',
    companyWebsite: '',
    role: '',
    employees: '',
    interests: activeMode === "licensing" ? ["licensing"] : []
  });

  const modalContent = mode === "licensing"
    ? {
      title: "Request WORKFORCEDGE Licensing Quote",
      subtitle: "Share your team details and we will contact you with pricing, licensing scope, and onboarding timeline.",
      interestLabel: "What do you need in your license plan? *",
      submitLabel: "Submit Licensing Request",
      successTitle: "Licensing Request Submitted",
      successBody: "Our team will contact you shortly with licensing details and next steps.",
      infoTitle: "What Happens Next?",
      infoBody: "Your request is reviewed by our team, and we will connect with a licensing proposal, implementation scope, and rollout recommendations."
    }
    : {
      title: "Book a Personalized WORKFORCEDGE Demo",
      subtitle: "Experience how WORKFORCEDGE can transform your HR operations",
      interestLabel: "Why do you want to use WORKFORCEDGE? *",
      submitLabel: "Book Demo",
      successTitle: "Form Submitted Successfully!",
      successBody: "We'll get back to you soon with demo details.",
      infoTitle: "Why WORKFORCEDGE?",
      infoBody: "WORKFORCEDGE is a lightweight, full-stack HR solution designed specifically for small organizations and startups with 10-30 employees. Replace spreadsheets with automated attendance tracking, leave management, worklogs, and employee records. Our system features AI-powered resume summarization, intelligent leave collision detection, and a smart chatbot for instant HR support."
    };

  const interestOptions = mode === "licensing"
    ? [
      { value: 'licensing', label: 'Licensing Plan', icon: Award, color: 'purple' },
      { value: 'onboarding', label: 'Onboarding Scope', icon: Rocket, color: 'green' },
      { value: 'compliance', label: 'Compliance Needs', icon: Shield, color: 'blue' },
      { value: 'migration', label: 'Data Migration', icon: Users, color: 'orange' }
    ]
    : [
      { value: 'attendance', label: 'Attendance', icon: Calendar, color: 'purple' },
      { value: 'leave', label: 'Leave Management', icon: FaCalendarTimes, color: 'green' },
      { value: 'worklogs', label: 'Worklogs', icon: BarChart3, color: 'blue' },
      { value: 'employee', label: 'Employee Management', icon: Users, color: 'orange' }
    ];

  const [formData, setFormData] = useState(() => getInitialFormData(mode));
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(mode));
      setShowSuccess(false);
      setSubmitError("");
    }
  }, [isOpen, mode]);

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
      setSubmitError("Please select at least one reason for using WORKFORCEDGE.");
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
        setFormData(getInitialFormData(mode));
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
            {modalContent.title}
          </h2>
          <p className="text-center mb-8" style={{ color: currentTheme.text.muted }}>
            {modalContent.subtitle}
          </p>


          {/* Demo Request Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
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
                <label className="block text-sm font-medium mb-2">Email Address *</label>
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
                <label className="block text-sm font-medium mb-2">Company Name *</label>
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
                <label className="block text-sm font-medium mb-2">Company Website</label>
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
                <label className="block text-sm font-medium mb-2">Role/Position *</label>
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
                <label className="block text-sm font-medium mb-2">Number of Employees *</label>
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
              <label className="block text-sm font-medium mb-3">{modalContent.interestLabel}</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {interestOptions.map((interest) => {
                  const Icon = interest.icon;
                  const isSelected = formData.interests.includes(interest.value);
                  return (
                    <motion.button
                      key={interest.value}
                      type="button"
                      onClick={() => handleInterestChange(interest.value)}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        isSelected ? `border-${interest.color}-500 bg-${interest.color}-500/10` : ''
                      }`}
                      style={{
                        borderColor: isSelected ? `#${interest.color === 'purple' ? '8B5CF6' : interest.color === 'green' ? '10B981' : interest.color === 'blue' ? '3B82F6' : 'F97316'}` : currentTheme.border,
                        backgroundColor: isSelected ? (isDarkTheme ? '#1E293B' : '#F8FAFC') : 'transparent'
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon size={24} className={isSelected ? `text-${interest.color}-500` : ''} />
                      <span className="text-sm">{interest.label}</span>
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
              <span>{isSubmitting ? "Submitting..." : modalContent.submitLabel}</span>
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </motion.button>
          </form>

          {/* WORKFORCEDGE Info */}
          <div className="mt-8 p-6 rounded-xl border" style={{ borderColor: currentTheme.border, backgroundColor: isDarkTheme ? '#0F172A' : '#F1F5F9' }}>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="text-purple-500" size={20} />
              {modalContent.infoTitle}
            </h4>
            <p className="text-sm" style={{ color: currentTheme.text.secondary }}>
              {modalContent.infoBody}
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
                <h3 className="text-2xl font-bold mb-2">{modalContent.successTitle}</h3>
                <p className="text-sm" style={{ color: currentTheme.text.muted }}>
                  {modalContent.successBody}
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
  const [requestModalMode, setRequestModalMode] = useState("demo");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [isStatsHovered, setIsStatsHovered] = useState(false);
  const [chatbotOpenSignal, setChatbotOpenSignal] = useState(0);
  const [isChatbotTeaserVisible, setIsChatbotTeaserVisible] = useState(true);
  const [activeSection, setActiveSection] = useState("home");
  
  const heroRef = useRef(null);
  const statsMarqueeRef = useRef(null);
  const statsMarqueeOffsetRef = useRef(0);
  const statsMarqueeLastTsRef = useRef(0);
  const statsMarqueeRafRef = useRef(null);
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

  const faqItems = [
    {
      question: "How does attendance tracking work in WORKFORCEDGE?",
      answer: "Employees can mark IN/OUT from their portal, and managers get real-time visibility of attendance logs. The system stores timestamped history, supports approval workflows where needed, and gives teams a clean monthly attendance view for quick reconciliation."
    },
    {
      question: "Can we configure leave policies for different departments?",
      answer: "Yes. Admins can configure multiple leave policies by role, department, and leave type. You can define balance limits, approval levels, and visibility rules so each team follows the correct policy without manual tracking."
    },
    {
      question: "What does the employee portal include?",
      answer: "The employee portal provides self-service tools for attendance IN/OUT, leave requests, daily work summaries, and attendance history. It is designed to help employees complete routine HR actions quickly without depending on manual coordination."
    },
    {
      question: "What does the manager dashboard include?",
      answer: "The manager portal combines pending approvals, attendance exceptions, leave requests, and daily work summaries in one place. It also provides team-level progress and quick insights so managers can act without switching between modules."
    },
    {
      question: "What does the admin portal include?",
      answer: "The admin portal includes organization-wide controls such as employee master records, role and department setup, leave policy configuration, and consolidated HR reporting. It is built for governance, configuration, and complete visibility across the system."
    },
    {
      question: "Is employee data secure on the platform?",
      answer: "WORKFORCEDGE is designed with secure access controls, protected data flow, and role-based permissions. Admin, manager, and employee actions are scoped to their allowed access so sensitive records stay protected and operationally traceable."
    },
    {
      question: "Can we manage recruitment and onboarding from the same platform?",
      answer: "Yes. WORKFORCEDGE supports recruitment workflows and lets teams transition candidate information into employee records. This reduces duplicate entry and helps HR move from hiring to onboarding with cleaner handoffs."
    },
    {
      question: "How quickly can a company get started?",
      answer: "Most teams can start with core modules quickly by setting up departments, roles, users, and leave rules. After this base setup, employees and managers can begin daily operations immediately using their dedicated portals."
    },
    {
      question: "Do employees and managers see different interfaces?",
      answer: "Absolutely. WORKFORCEDGE provides role-specific experiences: employee self-service for attendance and requests, manager controls for approvals and oversight, and admin controls for platform-wide configuration, governance, and reporting."
    }
  ];

  const statsTickerItems = [
    { value: "100%", label: "Secure", icon: <Shield size={18} className="text-purple-500" /> },
    { value: "24/7", label: "Availability", icon: <Clock size={18} className="text-green-500" /> },
    { value: "99.9%", label: "Uptime", icon: <TrendingUp size={18} className="text-blue-500" /> },
    { value: "0", label: "Spreadsheets", icon: <PiMicrosoftExcelLogoDuotone size={18} className="text-orange-500" /> }
  ];

  // Navigation handlers
  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleCareersClick = () => {
    scrollToSection('careers');
  };

  const handleDemoClick = (mode = "demo") => {
    setRequestModalMode(mode);
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
    setActiveSection(sectionId);
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

  useEffect(() => {
    const sectionIds = ["home", "about", "features", "licensing", "faq", "careers"];

    const updateActiveSection = () => {
      const scrollAnchor = window.scrollY + 130;
      const sectionsByPosition = sectionIds
        .map((id) => {
          const section = document.getElementById(id);
          if (!section) return null;
          return { id, top: section.offsetTop };
        })
        .filter(Boolean)
        .sort((a, b) => a.top - b.top);

      if (sectionsByPosition.length === 0) return;

      const current =
        sectionsByPosition
          .filter((section) => scrollAnchor >= section.top)
          .at(-1)?.id || sectionsByPosition[0].id;

      setActiveSection(current);
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    updateActiveSection();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  useEffect(() => {
    const track = statsMarqueeRef.current;
    if (!track) return;

    statsMarqueeLastTsRef.current = 0;

    const tick = (ts) => {
      if (!statsMarqueeRef.current) return;

      if (!statsMarqueeLastTsRef.current) {
        statsMarqueeLastTsRef.current = ts;
      }

      const deltaSeconds = (ts - statsMarqueeLastTsRef.current) / 1000;
      statsMarqueeLastTsRef.current = ts;

      const speedPxPerSecond = isStatsHovered ? 26 : 90;
      const halfTrackWidth = track.scrollWidth / 2;

      if (halfTrackWidth > 0) {
        statsMarqueeOffsetRef.current -= speedPxPerSecond * deltaSeconds;
        if (Math.abs(statsMarqueeOffsetRef.current) >= halfTrackWidth) {
          statsMarqueeOffsetRef.current += halfTrackWidth;
        }
        track.style.transform = `translate3d(${statsMarqueeOffsetRef.current}px, 0, 0)`;
      }

      statsMarqueeRafRef.current = window.requestAnimationFrame(tick);
    };

    statsMarqueeRafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (statsMarqueeRafRef.current) {
        window.cancelAnimationFrame(statsMarqueeRafRef.current);
      }
    };
  }, [isStatsHovered]);

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
                <p className="text-gray-300 text-sm">Experience the power of WORKFORCEDGE in action</p>
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
            mode={requestModalMode}
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
         <DigitalArtSection isDarkTheme={isDarkTheme} currentTheme={currentTheme} />
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
              alt="WORKFORCEDGE"
              className="h-12 w-auto object-contain"
              style={{ filter: !isDarkTheme ? 'brightness(0) saturate(100%) invert(27%) sepia(78%) saturate(2000%) hue-rotate(240deg)' : 'none' }}
            />
          </motion.div>

          {/* Desktop nav with hover effects */}
          <nav className="hidden sm:flex gap-8 text-sm tracking-wide">
            {[
              { id: "home", name: "Home", action: () => scrollToSection('home') },
              { id: "about", name: "About Us", action: () => scrollToSection('about') },
              { id: "features", name: "Features", action: () => scrollToSection('features') },
              { id: "licensing", name: "Licensing", action: () => scrollToSection('licensing') },
              { id: "careers", name: "Careers", action: () => scrollToSection('careers') },
              { id: "faq", name: "FAQs", action: () => scrollToSection('faq') },

            ].map((item, i) => (
              <motion.button
                key={item.id}
                onClick={item.action}
                className="relative"
                whileHover={{ y: -2 }}
                style={{ color: activeSection === item.id ? currentTheme.text.primary : currentTheme.text.secondary }}
              >
                {item.name}
                <span
                  className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-green-500 transition-all duration-200"
                  style={{ width: activeSection === item.id ? "100%" : "0%" }}
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
                  { icon: <Award size={16} />, name: "Licensing", action: () => { scrollToSection('licensing'); setMenu(false); } },
                  { icon: <Sparkles size={16} />, name: "FAQs", action: () => { scrollToSection('faq'); setMenu(false); } },
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
              digitally manage attendance, leaves, work logs, and team activity
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
           className="pt-32 pb-14 px-6 md:px-20 relative overflow-hidden"
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
                <span className="text-lg">About WORKFORCEDGE</span>
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
              className="p-8 rounded-6xl border backdrop-blur-sm relative overflow-hidden mb-16"
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
                    Why Choose WORKFORCEDGE?
                  </h3>
                  <p className="text-lg leading-relaxed" style={{ color: currentTheme.text.secondary }}>
                    WORKFORCEDGE is a digitized internal HR solution aimed to replace spreadsheets and provide real-time attendance,
                     approval workflows, and consolidated reporting for small teams. Our platform streamlines HR processes while
                     maintaining data security and compliance.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4" >
                  {[
                    { icon: <Shield />, label: "Enterprise Security" },
                    { icon: <Zap />, label: "Lightning Fast" },
                    { icon: <Heart />, label: "User Love" },
                    { icon: <TrendingUp />, label: "Scalable" }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="group p-4 rounded-xl text-center transition-colors duration-300"
                      style={{ backgroundColor: isDarkTheme ? '#0F172A' : '#F1F5F9' }}
                      whileHover={{ scale: 1.05, backgroundColor: '#8B5CF6' }}
                    >
                      <div className="text-2xl mb-2 text-purple-500 transition-colors duration-300 group-hover:text-white">
                        {item.icon}
                      </div>
                      <div
                        className="text-sm transition-colors duration-300 group-hover:text-white"
                        style={{ color: currentTheme.text.secondary }}
                      >
                        {item.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            <div
              className="mt-10 w-screen relative left-1/2 -translate-x-1/2 overflow-hidden"
              onMouseEnter={() => setIsStatsHovered(true)}
              onMouseLeave={() => setIsStatsHovered(false)}
              onTouchStart={() => setIsStatsHovered(true)}
              onTouchEnd={() => setIsStatsHovered(false)}
            >
              <div
                ref={statsMarqueeRef}
                className="flex w-max items-center whitespace-nowrap py-4"
                style={{ willChange: "transform", transform: "translate3d(0, 0, 0)" }}
              >
                {[...statsTickerItems, ...statsTickerItems].map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-7">
                    {stat.icon}
                    <span className="text-lg font-extrabold" style={{ color: currentTheme.text.primary }}>
                      {stat.value}
                    </span>
                    <span className="text-sm md:text-base font-medium" style={{ color: currentTheme.text.secondary }}>
                      {stat.label}
                    </span>
                    <span className="mx-4 text-lg" style={{ color: currentTheme.text.muted }}>
                      
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

{/* ============= TEAM SECTION ============= */}
<motion.section
  id="team-section"
  className="py-0.2 px-6 md:px-20 relative overflow-hidden"
  style={{ backgroundColor: isDarkTheme ? '#0F172A' : '#F1F5F9' }}
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  viewport={{ once: true }}
>
  <GlowingOrb color="#10B981" size="350px" position={{ x: '80%', y: '30%' }} delay={2} />
  
  <div className="relative z-10 max-w-6xl mx-auto">
    <motion.div
      className="text-center mb-16 py-10"
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
          Minds Behind WORKFORCEDGE
        </span>
      </h2>
      <p className="max-w-2xl mx-auto text-lg" style={{ color: currentTheme.text.muted }}>
        Passionate developers and designers creating the future of HR management
      </p>
    </motion.div>

    {/* Team Grid - Fixed alignment */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 place-items-center lg:place-items-stretch">
      {/* Dhanashree Khambal */}
      <motion.div
        className="w-full flex justify-center"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        viewport={{ once: true }}
      >
        <div className="w-full max-w-[280px] mx-auto">
          <ProfileCard
            name="Dhanashree Khambal"
            title="Full Stack Developer"  
            avatarUrl={team1}
            showUserInfo={false}
            enableTilt={true}
            enableMobileTilt={false}
            behindGlowColor="rgba(168, 85, 247, 0.52)"
            iconUrl={iconPattern}
            behindGlowEnabled={true}
            innerGradient="linear-gradient(145deg, #2d1b3e70 0%, #a855f730 100%)"
          />
        </div>
      </motion.div>

      {/* Bhavika Dhakate */}
      <motion.div
        className="w-full flex justify-center"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <div className="w-full max-w-[280px] mx-auto">
          <ProfileCard
            name="Bhavika Dhakate"
            title="Full Stack Developer"
            avatarUrl={team2}
            showUserInfo={false}
            enableTilt={true}
            enableMobileTilt={false}
            behindGlowColor="rgba(236, 72, 153, 0.52)"
            iconUrl={iconPattern}
            behindGlowEnabled={true}
            innerGradient="linear-gradient(145deg, #3e1b2e70 0%, #ec489930 100%)"
          />
        </div>
      </motion.div>

      {/* Mahek Sanghavi */}
      <motion.div
        className="w-full flex justify-center"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true }}
      >
        <div className="w-full max-w-[280px] mx-auto">
          <ProfileCard
            name="Mahek Sanghavi"
            title="Full Stack Developer"
            avatarUrl={team3}
            showUserInfo={false}
            enableTilt={true}
            enableMobileTilt={false}
            behindGlowColor="rgba(59, 130, 246, 0.52)"
            iconUrl={iconPattern}
            behindGlowEnabled={true}
            innerGradient="linear-gradient(145deg, #1b2e3e70 0%, #3b82f630 100%)"
          />
        </div>
      </motion.div>

      {/* Abhi Mistry */}
      <motion.div
        className="w-full flex justify-center"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        viewport={{ once: true }}
      >
        <div className="w-full max-w-[280px] mx-auto">
          <ProfileCard
            name="Abhi Mistry"
            title="Full Stack Developer"
            avatarUrl={team4}
            showUserInfo={false}
            enableTilt={true}
            enableMobileTilt={false}
            behindGlowColor="rgba(34, 197, 94, 0.52)"
            iconUrl={iconPattern}
            behindGlowEnabled={true}
            innerGradient="linear-gradient(145deg, #1b3e2e70 0%, #22c55e30 100%)"
          />
        </div>
      </motion.div>
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
                Everything{" "}
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

        {/* ============= EXPERIENCE SHOWCASE ============= */}
        <section
          id="modules"
          className="px-6 md:px-20 py-24 relative overflow-hidden"
          style={{
            background: isDarkTheme
              ? `linear-gradient(135deg, ${currentTheme.background}, #111827)`
              : `linear-gradient(135deg, ${currentTheme.background}, ${currentTheme.card})`,
          }}
        >
          <div className="max-w-7xl mx-auto relative">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-3">
                <h2
                  className="text-4xl md:text-6xl font-black leading-[1.05] tracking-tight"
                  style={{ color: currentTheme.text.primary }}
                >
                  Everything.{" "}
                  <span className="relative inline-block">
                    Everyone.
                    <span
                      className="absolute left-0 right-0 bottom-1 h-2 -z-10"
                      style={{ backgroundColor: isDarkTheme ? "rgba(139, 92, 246, 0.42)" : "rgba(216, 180, 140, 0.7)" }}
                    />
                  </span>{" "}
                  Everywhere.
                </h2>
                <p
                  className="mt-6 text-sm md:text-[18px] leading-relaxed max-w-3xl"
                  style={{ color: currentTheme.text.secondary }}
                >
                  Different interfaces designed for different roles with built-in compliance support, smoother onboarding, and faster everyday HR operations.
                </p>
              </div>

              <div className="hidden lg:flex lg:col-start-4 lg:row-span-2 relative h-full min-h-[620px] items-center justify-center">
                <div
                  className="absolute -left-8 top-6 w-[370px] h-[370px] border-[5px] border-l-transparent border-b-transparent rounded-full rotate-[12deg]"
                  style={{ borderColor: isDarkTheme ? "#8B5CF6" : "#f59e0b" }}
                />
                <img
                  src={modules}
                  alt="WORKFORCEDGE showcase"
                  className="relative z-10 h-[420px] w-[320px] object-cover rounded-[34px] shadow-[0_18px_38px_rgba(15,23,42,0.22)] border border-white/80"
                />
              </div>

              {[
                {
                  title: "Employee Portal",
                  icon: <Users size={26} />,
                  accent: "#8B5CF6",
                  lightBg: "rgba(139, 92, 246, 0.08)",
                  darkBg: "rgba(139, 92, 246, 0.16)",
                  lines: ["Attendance (IN/OUT)", "Leave Requests", "Daily Work Summaries", "Attendance History"],
                },
                {
                  title: "Manager Portal",
                  icon: <FiUserPlus size={26} />,
                  accent: "#10B981",
                  lightBg: "rgba(16, 185, 129, 0.1)",
                  darkBg: "rgba(16, 185, 129, 0.16)",
                  lines: ["Approve Attendance", "Approve Leaves", "Monitor Team Work Logs", "Team Overview & Analytics"],
                },
                {
                  title: "Admin Portal",
                  icon: <FiUserCheck size={26} />,
                  accent: "#3B82F6",
                  lightBg: "rgba(59, 130, 246, 0.08)",
                  darkBg: "rgba(59, 130, 246, 0.16)",
                  lines: ["Employee Master Records", "Role & Department Setup", "Leave Policies", "Full HR Reporting"],
                },
              ].map((card, idx) => (
                <motion.div
                  key={card.title}
                  className={`rounded-[22px] px-6 pt-14 pb-6 relative shadow-[0_12px_30px_rgba(15,23,42,0.08)] border backdrop-blur-sm`}
                  style={{
                    background: isDarkTheme
                      ? `linear-gradient(145deg, ${currentTheme.card}, ${card.darkBg})`
                      : `linear-gradient(145deg, ${currentTheme.card}, ${card.lightBg})`,
                    borderColor: isDarkTheme ? `${card.accent}66` : `${card.accent}40`,
                  }}
                  initial={{ y: 26, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.12 }}
                  whileHover={{ y: -8, boxShadow: `0 18px 35px ${card.accent}33` }}
                >
                  <div
                    className="absolute -top-8 left-8 w-20 h-20 rounded-full text-white flex items-center justify-center shadow-lg border-[6px]"
                    style={{
                      background: `linear-gradient(145deg, ${card.accent}, ${isDarkTheme ? currentTheme.card : "#111827"})`,
                      borderColor: isDarkTheme ? "rgba(15,23,42,0.7)" : "rgba(255,255,255,0.78)"
                    }}
                  >
                    {card.icon}
                  </div>
                  <h3 className="text-2xl md:text-2xl font-extrabold mb-4" style={{ color: currentTheme.text.primary }}>{card.title}</h3>
                  <ul className="space-y-2 text-base md:text-md leading-relaxed mb-6" style={{ color: currentTheme.text.secondary }}>
                    {card.lines.map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <CheckCircle size={16} style={{ color: card.accent, marginTop: "3px", flexShrink: 0 }} />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            <div className="lg:hidden mt-10 relative h-[360px] flex items-end justify-center">
              <div
                className="absolute right-4 bottom-0 w-44 h-44 rounded-full"
                style={{ backgroundColor: isDarkTheme ? "rgba(236, 72, 153, 0.28)" : "#f2b9bf" }}
              />
              <div
                className="absolute -left-8 top-6 w-[330px] h-[330px] border-[5px] border-l-transparent border-b-transparent rounded-full rotate-[12deg]"
                style={{ borderColor: isDarkTheme ? "#8B5CF6" : "#f59e0b" }}
              />
              <img
                src={modules}
                alt="WORKFORCEDGE showcase"
                className="relative z-10 h-[330px] w-[260px] object-cover rounded-[34px] shadow-[0_18px_38px_rgba(15,23,42,0.22)] border border-white/80"
              />
            </div>
          </div>
        </section>

        {/* ============= LICENSING SECTION ============= */}
        <motion.section
          id="licensing"
          className="py-10 px-6 md:px-20 relative overflow-hidden"
          style={{ backgroundColor: isDarkTheme ? "#0B1223" : "#F8FAFC" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <GlowingOrb color="#8B5CF6" size="300px" position={{ x: "8%", y: "28%" }} delay={0.6} />
          <GlowingOrb color="#10B981" size="260px" position={{ x: "88%", y: "72%" }} delay={1.2} />

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              className="text-center mb-14"
              initial={{ y: 24, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-green-500/20 px-4 py-2 rounded-full border border-purple-500/30 mb-5">
                <Award size={16} className="text-purple-500" />
                <span className="text-sm font-medium" style={{ color: currentTheme.text.secondary }}>Licensing</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-4" style={{ color: currentTheme.text.primary }}>
                One Clear{" "}
                <span className="bg-gradient-to-r from-purple-500 to-green-500 bg-clip-text text-transparent">
                  Paid Plan
                </span>
              </h2>
              <p className="max-w-3xl mx-auto text-base md:text-lg" style={{ color: currentTheme.text.muted }}>
                WORKFORCEDGE offers one complete paid license. No feature tiers. No hidden modules. Click proceed to buy to continue to the payment step.
              </p>
            </motion.div>

            <motion.div
              className="rounded-3xl border p-8 md:p-10 relative overflow-hidden"
              style={{
                background: isDarkTheme
                  ? `linear-gradient(145deg, ${currentTheme.card}, rgba(17,24,39,0.95))`
                  : `linear-gradient(145deg, #FFFFFF, ${currentTheme.cardHover})`,
                borderColor: currentTheme.border,
              }}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -6, boxShadow: "0 24px 45px rgba(139,92,246,0.2)" }}
            >
              <motion.div
                className="absolute -right-20 -top-20 w-56 h-56 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)" }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
              <motion.div
                className="absolute -left-16 -bottom-16 w-52 h-52 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 70%)" }}
                animate={{ scale: [1.1, 1, 1.1] }}
                transition={{ duration: 6, repeat: Infinity }}
              />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mb-4"
                    style={{
                      color: "#FFFFFF",
                      background: "linear-gradient(90deg, #8B5CF6, #10B981)"
                    }}
                  >
                    Single Paid License
                  </span>
                  <h3 className="text-3xl md:text-4xl font-extrabold mb-3" style={{ color: currentTheme.text.primary }}>
                    WORKFORCEDGE Plan
                  </h3>
                  <p className="text-sm mb-6" style={{ color: currentTheme.text.muted }}>
                    One complete plan with full platform access.
                  </p>
                  <div className="rounded-2xl border px-5 py-4" style={{ borderColor: currentTheme.border, backgroundColor: isDarkTheme ? "#0F172A" : "#F8FAFC" }}>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: currentTheme.text.muted }}>Commercial Terms</p>
                    <p className="text-2xl font-bold" style={{ color: currentTheme.text.primary }}>INR XXXXX / year</p>
                  </div>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Full access for Employee, Manager, and Admin portals",
                    "Attendance, leave workflows, and daily work summaries",
                    "Organization setup: departments, roles, and policies",
                    "Analytics and reporting across HR operations",
                    "Implementation onboarding and go-live guidance",
                    "Contracted support and SLA terms during license period"
                  ].map((item, idx) => (
                    <motion.div
                      key={item}
                      className="rounded-xl border p-4"
                      style={{
                        borderColor: currentTheme.border,
                        backgroundColor: isDarkTheme ? "rgba(15,23,42,0.75)" : "rgba(255,255,255,0.88)"
                      }}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.06 }}
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm leading-relaxed" style={{ color: currentTheme.text.secondary }}>{item}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 mt-8 flex flex-wrap gap-3">
                <motion.button
                  onClick={() => navigate("/licensing/checkout")}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-green-600"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Proceed to Buy
                </motion.button>
              </div>
            </motion.div>
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

        {/* ============= FAQ SECTION ============= */}
        <motion.section
          id="faq"
          className="py-24 px-6 md:px-20 relative overflow-hidden"
          style={{ backgroundColor: currentTheme.background }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <GlowingOrb color="#8B5CF6" size="280px" position={{ x: "8%", y: "72%" }} delay={1.2} />
          <GlowingOrb color="#10B981" size="280px" position={{ x: "90%", y: "20%" }} delay={2} />

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              className="text-center mb-16"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              <div
                className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full border backdrop-blur-sm"
                style={{
                  borderColor: isDarkTheme ? "rgba(139, 92, 246, 0.4)" : "rgba(16, 185, 129, 0.35)",
                  backgroundColor: isDarkTheme ? "rgba(139, 92, 246, 0.14)" : "rgba(16, 185, 129, 0.1)",
                  color: currentTheme.text.secondary
                }}
              >
                <Sparkles size={16} />
                <span className="text-sm font-medium">Frequently Asked Questions</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-4" style={{ color: currentTheme.text.primary }}>
                Everything You Need{" "}
                <span className="bg-gradient-to-r from-purple-500 to-green-500 bg-clip-text text-transparent">
                  To Know
                </span>
              </h2>
              <p className="max-w-3xl mx-auto text-base md:text-lg" style={{ color: currentTheme.text.muted }}>
                Quick answers for setup, attendance workflows, approvals, data security, and role-based access across WORKFORCEDGE.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {faqItems.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <motion.div
                      key={faq.question}
                      className="rounded-2xl border overflow-hidden"
                      style={{
                        backgroundColor: currentTheme.card,
                        borderColor: isOpen ? "rgba(139, 92, 246, 0.6)" : currentTheme.border
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: idx * 0.06 }}
                    >
                      <button
                        className="w-full px-6 py-5 text-left flex items-start gap-4"
                        onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                      >
                        <span
                          className="mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: isOpen
                              ? (isDarkTheme ? "rgba(139, 92, 246, 0.2)" : "rgba(16, 185, 129, 0.16)")
                              : (isDarkTheme ? "#0F172A" : "#EEF2FF"),
                            color: isOpen ? "#8B5CF6" : currentTheme.text.muted
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span className="flex-1 pr-2">
                          <span className="block text-lg font-semibold" style={{ color: currentTheme.text.primary }}>
                            {faq.question}
                          </span>
                        </span>
                        <motion.div
                          animate={{ rotate: isOpen ? 90 : 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ color: isOpen ? "#8B5CF6" : currentTheme.text.muted }}
                        >
                          <ChevronRight size={22} />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 pl-[4.25rem]">
                              <p className="text-sm md:text-base leading-relaxed" style={{ color: currentTheme.text.secondary }}>
                                {faq.answer}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                className="rounded-3xl border p-7 md:p-8 h-fit"
                style={{
                  background: isDarkTheme
                    ? `linear-gradient(145deg, ${currentTheme.card}, rgba(30, 41, 59, 0.92))`
                    : `linear-gradient(145deg, ${currentTheme.card}, rgba(241, 245, 249, 0.95))`,
                  borderColor: currentTheme.border
                }}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold mb-4" style={{ color: currentTheme.text.primary }}>Need More Help?</h3>
                <p className="text-sm leading-relaxed mb-6" style={{ color: currentTheme.text.muted }}>
                  Use the WORKFORCEDGE Assistant for instant guidance on attendance, leaves, and day-to-day portal workflows.
                </p>
                <div className="space-y-4">
                  {[
                    "Role-based portals for Employees, Managers, and Admins",
                    "Guided approvals for attendance and leave requests",
                    "Clear visibility on team activity and summaries"
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle size={16} className="mt-0.5 text-green-500 flex-shrink-0" />
                      <span className="text-sm" style={{ color: currentTheme.text.secondary }}>{item}</span>
                    </div>
                  ))}
                </div>
                <motion.button
                  className="mt-8 w-full rounded-xl py-3 px-4 text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(90deg, #8B5CF6, #10B981)" }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setChatbotOpenSignal((prev) => prev + 1)}
                >
                  Open Support Assistant
                </motion.button>
              </motion.div>
            </div>
          </div>
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
                  description: "By using WORKFORCEDGE, you agree to our terms of service. We provide the platform as-is with continuous improvements. Users are responsible for maintaining the confidentiality of their accounts.",
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
                  alt="WORKFORCEDGE"
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
                Internal HR Automation System  2025
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
            style={{ bottom: isChatbotTeaserVisible ? '11rem' : '6rem' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <BiSolidArrowToTop size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <Chatbot
        endpoint="/api/chatbot/public-ask"
        welcomeMessage={`Welcome to WORKFORCEDGE!\nAsk me anything about attendance, leave management, hiring, or HR workflows.\nI'm here to help.`}
        title="WORKFORCEDGE Assistant"
        subtitle="FAQs & S, atupport"
        autoOpen={true}
        teaserMessage={`Welcome to WORKFORCEDGE!\nI'm WORKFORCEDGE's assistant, here to help.`}
        openSignal={chatbotOpenSignal}
        onTeaserVisibilityChange={setIsChatbotTeaserVisible}
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
