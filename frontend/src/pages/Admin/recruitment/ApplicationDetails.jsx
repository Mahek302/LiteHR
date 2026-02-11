import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiArrowLeft, FiUser, FiMail, FiPhone, FiBriefcase,
  FiCalendar, FiMapPin, FiDownload, FiCheck, FiX,
  FiMessageSquare, FiStar, FiFileText, FiRefreshCw, FiCopy,
  FiUpload, FiAlertCircle, FiClock, FiActivity
} from "react-icons/fi";
import jobService from "../../../services/jobService";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useTheme, useThemeClasses } from "../../../contexts/ThemeContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ApplicationDetails = () => {
  const { id } = useParams();
  const darkMode = useTheme() || false;
  const theme = useThemeClasses();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Reviewed");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(4);
  const [cvSummary, setCvSummary] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [apiError, setApiError] = useState(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const data = await jobService.getJobApplicationById(id);
        setApplication(data);
        setStatus(data.status);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load application:", error);
        toast.error("Failed to load application details");
        setLoading(false);
      }
    };
    fetchApplication();
  }, [id]);

  // Theme helper functions
  const getBgColor = () => darkMode ? "bg-gray-900" : "bg-white";
  const getBorderColor = () => darkMode ? "border-gray-700" : "border-gray-200";
  const getTextColor = () => darkMode ? "text-white" : "text-gray-800";
  const getSecondaryTextColor = () => darkMode ? "text-gray-400" : "text-gray-600";
  const getInputBg = () => darkMode ? "bg-gray-800" : "bg-gray-50";
  const getCardBg = () => darkMode ? "bg-gray-800/50" : "bg-white";
  const getPageBg = () => darkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20";

  const handleGenerateSummary = async () => {
    if (!application?.resumeUrl) {
      toast.error("No resume available to summarize");
      return;
    }

    setIsGeneratingSummary(true);
    setApiError(null);
    setShowErrorDetails(false);

    try {
      const response = await axios.post(`/api/cv/summarize/url`, {
        cvUrl: application.resumeUrl,
        jobPosition: application.job?.title || application.appliedFor,
        applicationId: id
      }, {
        timeout: 45000
      });

      if (response.data.success) {
        const summary = response.data.summary;
        setCvSummary(summary);
        toast.success("CV summary generated successfully!");
      } else {
        throw new Error(response.data.error || 'Failed to generate summary');
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      setApiError(error.response?.data?.error || error.message);
      toast.error("Failed to generate summary");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await jobService.updateJobApplicationStatus(id, { status: newStatus });
      setStatus(newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDownloadCV = () => {
    if (!application?.resumeUrl) {
      toast.error("No CV to download");
      return;
    }
    const url = application.resumeUrl.startsWith('http')
      ? application.resumeUrl
      : `${API_BASE_URL}${application.resumeUrl}`;

    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getPageBg()}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${darkMode ? 'border-indigo-500' : 'border-indigo-600'} mx-auto mb-4`}></div>
          <p className={`${getTextColor()} font-medium`}>Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getPageBg()}`}>
        <div className="text-center">
          <FiAlertCircle className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-4`} />
          <p className={`${getTextColor()} font-medium`}>Application not found</p>
        </div>
      </div>
    );
  }

  const skillsDisplay = Array.isArray(application.skills)
    ? application.skills
    : (application.skills ? application.skills.split(',') : []);

  const getStatusColor = (status) => {
    const colors = {
      "New": darkMode ? "bg-blue-500/10 text-blue-300 border-blue-500/20" : "bg-blue-50 text-blue-700 border-blue-200",
      "Reviewed": darkMode ? "bg-amber-500/10 text-amber-300 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-200",
      "Interview": darkMode ? "bg-purple-500/10 text-purple-300 border-purple-500/20" : "bg-purple-50 text-purple-700 border-purple-200",
      "Hired": darkMode ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200",
      "Rejected": darkMode ? "bg-rose-500/10 text-rose-300 border-rose-500/20" : "bg-rose-50 text-rose-700 border-rose-200"
    };
    return colors[status] || colors["New"];
  };

  return (
    <div className={`min-h-screen ${getPageBg()}`}>
      {/* Enhanced Header */}
      <div className={`${getBgColor()} border-b ${getBorderColor()} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                to="/admin/recruitment/applications"
                className={`flex items-center justify-center w-10 h-10 rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-300'} ${darkMode ? 'bg-gray-800' : 'bg-white'} ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${darkMode ? 'hover:border-gray-600' : 'hover:border-gray-400'} transition-all duration-200`}
              >
                <FiArrowLeft className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </Link>
              <div>
                <h1 className={`text-2xl font-bold ${getTextColor()} tracking-tight`}>
                  Application Review
                </h1>
                <p className={`${getSecondaryTextColor()} mt-1`}>
                  Comprehensive candidate evaluation and hiring workflow
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadCV}
              disabled={!application.resumeUrl}
              className={`flex items-center gap-2 px-5 py-2.5 ${darkMode ? 'bg-gray-800' : 'bg-gray-900'} text-grey rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-800'} transition-colors duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
            >
              <FiDownload className="w-4 h-4 text-grey" />
              Download Resume
            </button>
          </div>
        </div>
      </div>

      {/* API Error Display */}
      {apiError && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className={`${darkMode ? 'bg-rose-500/10' : 'bg-rose-50'} border ${darkMode ? 'border-rose-500/20' : 'border-rose-200'} rounded-xl p-4`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className={`${darkMode ? 'text-rose-300' : 'text-rose-900'} font-semibold text-sm`}>API Error</h4>
                  <p className={`${darkMode ? 'text-rose-400' : 'text-rose-700'} text-sm mt-1`}>{apiError}</p>
                </div>
              </div>
              <button
                onClick={() => setApiError(null)}
                className="text-rose-600 dark:text-rose-500 hover:text-rose-800 dark:hover:text-rose-400 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Candidate Profile Card */}
            <div className={`${getCardBg()} rounded-2xl shadow-sm border ${getBorderColor()} overflow-hidden`}>
              {/* Header Section */}
              <div className="bg-gradient-to-r from-indigo-900 to-blue-800 px-8 py-8">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold border border-white/30 shadow-lg">
                    {application.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-1">{application.name}</h2>
                    <p className="text-indigo-100 font-medium">{application.job?.title}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <FiClock className="w-4 h-4 text-indigo-200" />
                      <span className="text-sm text-indigo-100">
                        Applied {new Date(application.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className={`px-8 py-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-500/30 transition-colors">
                      <FiMail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Email</p>
                      <p className={`text-sm ${getTextColor()} font-medium`}>{application.email}</p>
                    </div>
                  </div>
                  {application.phone && (
                    <div className="flex items-center gap-3 group">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/30 transition-colors">
                        <FiPhone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Phone</p>
                        <p className={`text-sm ${getTextColor()} font-medium`}>{application.phone}</p>
                      </div>
                    </div>
                  )}
                  {application.linkedin && (
                    <div className="flex items-center gap-3 group">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-500/30 transition-colors">
                        <FiUser className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">LinkedIn</p>
                        <a
                          href={application.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
                        >
                          View Profile
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className={`px-8 py-6 border-b ${getBorderColor()}`}>
                <h3 className={`text-sm font-semibold ${getTextColor()} uppercase tracking-wide mb-4`}>Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleStatusChange("Interview")}
                    className={`flex flex-col items-center gap-2 px-4 py-4 ${darkMode ? 'bg-purple-500/10' : 'bg-purple-50'} border ${darkMode ? 'border-purple-500/20' : 'border-purple-200'} ${darkMode ? 'text-purple-300' : 'text-purple-700'} rounded-xl hover:bg-purple-100 dark:hover:bg-purple-500/20 hover:border-purple-300 dark:hover:border-purple-500/30 transition-all duration-200 font-medium`}
                  >
                    <FiCalendar className="w-5 h-5" />
                    <span className="text-sm">Interview</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange("Hired")}
                    className={`flex flex-col items-center gap-2 px-4 py-4 ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'} border ${darkMode ? 'border-emerald-500/20' : 'border-emerald-200'} ${darkMode ? 'text-emerald-300' : 'text-emerald-700'} rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all duration-200 font-medium`}
                  >
                    <FiCheck className="w-5 h-5" />
                    <span className="text-sm">Hire</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange("Rejected")}
                    className={`flex flex-col items-center gap-2 px-4 py-4 ${darkMode ? 'bg-rose-500/10' : 'bg-rose-50'} border ${darkMode ? 'border-rose-500/20' : 'border-rose-200'} ${darkMode ? 'text-rose-300' : 'text-rose-700'} rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:border-rose-300 dark:hover:border-rose-500/30 transition-all duration-200 font-medium`}
                  >
                    <FiX className="w-5 h-5" />
                    <span className="text-sm">Reject</span>
                  </button>
                  <button
                    onClick={() => {
                      const subject = encodeURIComponent(`Update regarding your application for ${application.job?.title || 'position'}`);
                      window.location.href = `mailto:${application.email}?subject=${subject}`;
                    }}
                    className={`flex flex-col items-center gap-2 px-4 py-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${darkMode ? 'text-gray-400' : 'text-gray-700'} rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 font-medium`}
                  >
                    <FiMessageSquare className="w-5 h-5" />
                    <span className="text-sm">Contact</span>
                  </button>
                </div>
              </div>

              {/* Skills Section */}
              {skillsDisplay.length > 0 && (
                <div className={`px-8 py-6 border-b ${getBorderColor()}`}>
                  <h3 className={`text-sm font-semibold ${getTextColor()} uppercase tracking-wide mb-4`}>Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {skillsDisplay.map((skill, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1.5 ${darkMode ? 'bg-indigo-500/20' : 'bg-indigo-50'} ${darkMode ? 'text-indigo-300' : 'text-indigo-700'} rounded-lg text-sm font-medium border ${darkMode ? 'border-indigo-500/20' : 'border-indigo-200'}`}
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CV Summary Section */}
            <div className={`${getCardBg()} rounded-2xl shadow-sm border ${getBorderColor()} overflow-hidden`}>
              <div className={`px-8 py-6 border-b ${getBorderColor()} ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className={`text-lg font-bold ${getTextColor()}`}>AI-Powered CV Analysis</h3>
                    <p className={`${getSecondaryTextColor()} mt-1`}>Intelligent resume insights and candidate matching</p>
                  </div>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary || !application.resumeUrl}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm whitespace-nowrap"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
                    {isGeneratingSummary ? 'Analyzing...' : 'Generate Analysis'}
                  </button>
                </div>
              </div>

              {isGeneratingSummary && (
                <div className={`px-8 py-6 ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'} border-b ${darkMode ? 'border-indigo-500/10' : 'border-indigo-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <div>
                      <p className={`${darkMode ? 'text-indigo-300' : 'text-indigo-900'} font-medium`}>Generating AI-powered analysis...</p>
                      <p className={`${darkMode ? 'text-indigo-400' : 'text-indigo-600'} text-sm mt-0.5`}>This typically takes 15-30 seconds</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className={`flex border-b ${getBorderColor()}`}>
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${activeTab === "summary"
                    ? `${darkMode ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/10' : 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'}`
                    : `${getSecondaryTextColor()} hover:text-indigo-600 dark:hover:text-indigo-400 hover:${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`
                    }`}
                >
                  <FiFileText className="inline-block w-4 h-4 mr-2" />
                  AI Summary
                </button>
                <button
                  onClick={() => setActiveTab("cover")}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${activeTab === "cover"
                    ? `${darkMode ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/10' : 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'}`
                    : `${getSecondaryTextColor()} hover:text-indigo-600 dark:hover:text-indigo-400 hover:${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`
                    }`}
                >
                  <FiBriefcase className="inline-block w-4 h-4 mr-2" />
                  Cover Letter
                </button>
              </div>

              {/* Content */}
              <div className="p-8">
                {activeTab === "summary" ? (
                  <div>
                    {cvSummary ? (
                      <div className="space-y-6">
                        {typeof cvSummary === 'object' ? (
                          <>
                            {cvSummary.name && (
                              <div className="mb-6">
                                <p className={`text-2xl font-bold ${getTextColor()}`}>{cvSummary.name}</p>
                              </div>
                            )}

                            {/* Professional Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                              {(cvSummary.currentRole || cvSummary.currentCompany) && (
                                <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4 border ${getBorderColor()}`}>
                                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Current Position</h4>
                                  <p className={`${getTextColor()} font-medium`}>
                                    {cvSummary.currentRole || 'Not specified'}
                                    {cvSummary.currentCompany && <span className={`${getSecondaryTextColor()}`}> at {cvSummary.currentCompany}</span>}
                                  </p>
                                </div>
                              )}

                              {cvSummary.experience && (
                                <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4 border ${getBorderColor()}`}>
                                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Experience</h4>
                                  <p className={`${getTextColor()} font-medium`}>{cvSummary.experience}</p>
                                </div>
                              )}

                              {cvSummary.education && (
                                <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4 border ${getBorderColor()} md:col-span-2`}>
                                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Education</h4>
                                  <p className={`${getTextColor()} font-medium`}>{cvSummary.education}</p>
                                </div>
                              )}
                            </div>
                            {cvSummary.summary && (
                              <div>
                                <h4 className={`text-sm font-semibold ${getTextColor()} uppercase tracking-wide mb-3`}>Executive Summary</h4>
                                <p className={`${getSecondaryTextColor()} leading-relaxed`}>{cvSummary.summary}</p>
                              </div>
                            )}
                            {cvSummary.skills && cvSummary.skills.length > 0 && (
                              <div>
                                <h4 className={`text-sm font-semibold ${getTextColor()} uppercase tracking-wide mb-3`}>Key Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                  {(Array.isArray(cvSummary.skills) ? cvSummary.skills : cvSummary.skills.split(',')).map((skill, idx) => (
                                    <span
                                      key={idx}
                                      className={`px-3 py-1.5 ${darkMode ? 'bg-blue-500/20' : 'bg-blue-50'} ${darkMode ? 'text-blue-300' : 'text-blue-700'} rounded-lg text-sm font-medium border ${darkMode ? 'border-blue-500/20' : 'border-blue-200'}`}
                                    >
                                      {skill.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {cvSummary.strengths && cvSummary.strengths.length > 0 && (
                              <div>
                                <h4 className={`text-sm font-semibold ${getTextColor()} uppercase tracking-wide mb-3`}>Key Strengths</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {cvSummary.strengths.map((strength, idx) => (
                                    <div key={idx} className={`flex items-start gap-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-3 border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                      <span className="text-emerald-500 font-bold">✓</span>
                                      <span className={`${getSecondaryTextColor()} text-sm`}>{strength}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {cvSummary.recommendations && cvSummary.recommendations.length > 0 && (
                              <div>
                                <h4 className={`text-sm font-semibold ${getTextColor()} uppercase tracking-wide mb-3`}>AI Recommendations</h4>
                                <div className="space-y-2">
                                  {cvSummary.recommendations.map((rec, idx) => (
                                    <div key={idx} className={`flex items-start gap-3 ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'} rounded-lg p-3 border ${darkMode ? 'border-indigo-500/10' : 'border-indigo-100'}`}>
                                      <span className="text-indigo-500 font-bold">💡</span>
                                      <span className={`${getSecondaryTextColor()} text-sm`}>{rec}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {cvSummary.matchScore !== undefined && (
                              <div className={`${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'} border ${darkMode ? 'border-emerald-500/20' : 'border-emerald-200'} rounded-xl p-5`}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-emerald-300' : 'text-emerald-900'} uppercase tracking-wide`}>Match Score</h4>
                                    <p className={`${darkMode ? 'text-emerald-400' : 'text-emerald-700'} text-sm mt-1`}>Candidate-role compatibility</p>
                                  </div>
                                  <div className={`text-4xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{cvSummary.matchScore}%</div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className={`${getSecondaryTextColor()} leading-relaxed whitespace-pre-line`}>{cvSummary}</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className={`w-16 h-16 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                          <FiFileText className={`w-8 h-8 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        </div>
                        <h4 className={`text-lg font-bold ${getTextColor()} mb-2`}>No AI Analysis Yet</h4>
                        <p className={`${getSecondaryTextColor()} max-w-sm mx-auto`}>
                          Click "Generate Analysis" to create an AI-powered summary of this candidate's resume.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 className={`text-sm font-semibold ${getTextColor()} uppercase tracking-wide mb-4`}>Cover Letter</h4>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className={`${getSecondaryTextColor()} leading-relaxed whitespace-pre-line`}>
                        {application.coverLetter || (
                          <span className={`${getSecondaryTextColor()} italic`}>No cover letter provided by the candidate.</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Status & Timeline */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`${getCardBg()} rounded-2xl shadow-sm border ${getBorderColor()} overflow-hidden`}>
              <div className={`px-6 py-5 border-b ${getBorderColor()} ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <h3 className={`text-lg font-bold ${getTextColor()}`}>Application Status</h3>
              </div>

              <div className="p-6 space-y-5">
                {/* Current Status */}
                <div>
                  <p className={`text-xs font-semibold ${getSecondaryTextColor()} uppercase tracking-wide mb-3`}>Current Status</p>
                  <div className={`px-4 py-3 rounded-xl border-2 font-semibold text-sm ${getStatusColor(status)}`}>
                    <div className="flex items-center justify-between">
                      <span>{status}</span>
                      <FiActivity className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Status Options */}
                <div>
                  <p className={`text-xs font-semibold ${getSecondaryTextColor()} uppercase tracking-wide mb-3`}>Update Status</p>
                  <div className="space-y-2">
                    {["New", "Reviewed", "Interview", "Hired", "Rejected"].map((statusOption) => (
                      <button
                        key={statusOption}
                        onClick={() => handleStatusChange(statusOption)}
                        className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${status === statusOption
                          ? "bg-indigo-600 text-white shadow-sm"
                          : `${darkMode ? 'bg-gray-800' : 'bg-gray-50'} ${getTextColor()} border ${getBorderColor()} hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'} hover:${darkMode ? 'border-gray-600' : 'border-gray-300'}`
                          }`}
                      >
                        {statusOption}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Application Info */}
            <div className={`${getCardBg()} rounded-2xl shadow-sm border ${getBorderColor()} overflow-hidden`}>
              <div className={`px-6 py-5 border-b ${getBorderColor()} ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <h3 className={`text-lg font-bold ${getTextColor()}`}>Application Info</h3>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <FiCalendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${getSecondaryTextColor()} uppercase tracking-wide`}>Applied On</p>
                    <p className={`text-sm ${getTextColor()} font-medium mt-1`}>
                      {new Date(application.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <FiBriefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${getSecondaryTextColor()} uppercase tracking-wide`}>Position</p>
                    <p className={`text-sm ${getTextColor()} font-medium mt-1`}>{application.job?.title || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails;