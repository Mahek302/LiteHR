import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiUsers, FiArrowLeft, FiEdit2, FiBriefcase, FiMapPin, FiClock, FiCalendar, FiCheckCircle } from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import jobService from "../../../services/jobService";
import { toast } from "react-hot-toast";
import { useTheme, useThemeClasses } from "../../../contexts/ThemeContext";

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const darkMode = useTheme() || false;
    const theme = useThemeClasses();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const data = await jobService.getJobById(id);
                setJob(data);
            } catch (error) {
                console.error("Error fetching job details:", error);
                toast.error("Failed to load job details");
                navigate("/admin/recruitment/jobs");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchJob();
        }
    }, [id, navigate]);

    if (loading) {
        return (
            <div className={`flex items-center justify-center min-h-[400px] ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                <div className={`w-12 h-12 border-4 ${darkMode ? 'border-blue-500' : 'border-blue-600'} border-t-transparent rounded-full animate-spin`}></div>
            </div>
        );
    }

    if (!job) {
        return null;
    }

    // Theme helper functions
    const getBgColor = () => darkMode ? "bg-gray-900" : "bg-white";
    const getBorderColor = () => darkMode ? "border-gray-700" : "border-gray-200";
    const getTextColor = () => darkMode ? "text-white" : "text-gray-800";
    const getSecondaryTextColor = () => darkMode ? "text-gray-400" : "text-gray-600";
    const getInputBg = () => darkMode ? "bg-gray-800" : "bg-gray-50";
    const getCardBg = () => darkMode ? "bg-gray-800/50" : "bg-white";
    const getHeaderBg = () => darkMode ? "from-gray-900 via-gray-800 to-gray-900" : "from-blue-50 via-indigo-50 to-purple-50";

    return (
        <div className="w-full">
            {/* Header */}
            <div className={`relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br ${getHeaderBg()} p-8 border ${getBorderColor()}`}>
                <div className={`absolute inset-0 ${darkMode ? 'opacity-20' : 'opacity-10'}`} style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='${darkMode ? '0.1' : '0.05'}'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                                <Link
                                    to="/admin/recruitment/jobs"
                                    className={`p-2 rounded-lg ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'} ${getTextColor()} transition-colors`}
                                >
                                    <FiArrowLeft className="w-5 h-5" />
                                </Link>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${job.status === "Active"
                                    ? `${darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`
                                    : `${darkMode ? 'bg-gray-700/50 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'}`
                                    }`}>
                                    {job.status}
                                </span>
                            </div>

                            <h1 className={`text-3xl font-bold ${getTextColor()} mb-2`}>{job.title}</h1>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <span className={`flex items-center gap-1.5 ${getSecondaryTextColor()}`}>
                                    <FiUsers className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                                    {job.department}
                                </span>
                                <span className={`flex items-center gap-1.5 ${getSecondaryTextColor()}`}>
                                    <FiBriefcase className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                                    {job.jobType}
                                </span>
                                <span className={`flex items-center gap-1.5 ${getSecondaryTextColor()}`}>
                                    <FiMapPin className={`w-4 h-4 ${darkMode ? 'text-rose-400' : 'text-rose-500'}`} />
                                    {job.location || "Remote"}
                                </span>
                                <span className={`flex items-center gap-1.5 ${getSecondaryTextColor()}`}>
                                    <FiClock className={`w-4 h-4 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />
                                    Posted {new Date(job.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <Link
                            to={`/admin/recruitment/edit-job/${job.id}`}
                            className={`flex items-center gap-2 px-5 py-2.5 ${darkMode ? 'bg-gray-800' : 'bg-gray-900'} text-grey rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-800'} transition-colors duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
                        >
                            <FiEdit2 className="w-4 h-4 text-grey" />
                            Edit Posting
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description */}
                    <div className={`${getCardBg()} rounded-2xl p-6 border ${getBorderColor()}`}>
                        <h2 className={`text-xl font-semibold ${getTextColor()} mb-4 flex items-center gap-2`}>
                            <FiBriefcase className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                            Job Description
                        </h2>
                        <div className={`prose ${darkMode ? 'prose-invert' : 'prose-gray'} max-w-none ${getSecondaryTextColor()} whitespace-pre-wrap`}>
                            {job.description}
                        </div>
                    </div>

                    {/* Requirements */}
                    <div className={`${getCardBg()} rounded-2xl p-6 border ${getBorderColor()}`}>
                        <h2 className={`text-xl font-semibold ${getTextColor()} mb-4 flex items-center gap-2`}>
                            <FiCheckCircle className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-500'}`} />
                            Requirements
                        </h2>
                        <div className={`prose ${darkMode ? 'prose-invert' : 'prose-gray'} max-w-none ${getSecondaryTextColor()} whitespace-pre-wrap`}>
                            {job.requirements}
                        </div>
                    </div>

                    {/* Responsibilities */}
                    <div className={`${getCardBg()} rounded-2xl p-6 border ${getBorderColor()}`}>
                        <h2 className={`text-xl font-semibold ${getTextColor()} mb-4 flex items-center gap-2`}>
                            <FiCheckCircle className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-500'}`} />
                            Responsibilities
                        </h2>
                        <div className={`prose ${darkMode ? 'prose-invert' : 'prose-gray'} max-w-none ${getSecondaryTextColor()} whitespace-pre-wrap`}>
                            {job.responsibilities}
                        </div>
                    </div>

                    {/* Skills */}
                    <div className={`${getCardBg()} rounded-2xl p-6 border ${getBorderColor()}`}>
                        <h2 className={`text-xl font-semibold ${getTextColor()} mb-4 flex items-center gap-2`}>
                            <FiCheckCircle className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-500'}`} />
                            Skills
                        </h2>
                        <div className={`prose ${darkMode ? 'prose-invert' : 'prose-gray'} max-w-none ${getSecondaryTextColor()} whitespace-pre-wrap`}>
                            {job.skills}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Key Details Card */}
                    <div className={`${getCardBg()} rounded-2xl p-6 border ${getBorderColor()}`}>
                        <h3 className={`text-lg font-semibold ${getTextColor()} mb-4`}>Key Details</h3>
                        <div className="space-y-4">
                            <div className={`flex items-start gap-3 p-3 rounded-lg ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'} border ${getBorderColor()}`}>
                                <div className={`p-2 rounded-lg ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-100'} ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                    <FaRupeeSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`text-sm ${getSecondaryTextColor()}`}>Salary Range</p>
                                    <p className={`font-medium ${getTextColor()}`}>
                                        {job.salaryRangeMin && job.salaryRangeMax
                                            ? `₹${job.salaryRangeMin} - ₹${job.salaryRangeMax}`
                                            : "Not specified"}
                                    </p>
                                </div>
                            </div>

                            <div className={`flex items-start gap-3 p-3 rounded-lg ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'} border ${getBorderColor()}`}>
                                <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/10' : 'bg-blue-100'} ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                    <FiBriefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`text-sm ${getSecondaryTextColor()}`}>Experience</p>
                                    <p className={`font-medium ${getTextColor()}`}>
                                        {job.experienceMin || job.experienceMax
                                            ? `${job.experienceMin || 0} - ${job.experienceMax || "10+"} Years`
                                            : "Not specified"}
                                    </p>
                                </div>
                            </div>

                            <div className={`flex items-start gap-3 p-3 rounded-lg ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'} border ${getBorderColor()}`}>
                                <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/10' : 'bg-purple-100'} ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                    <FiCalendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`text-sm ${getSecondaryTextColor()}`}>Application Deadline</p>
                                    <p className={`font-medium ${getTextColor()}`}>
                                        {job.deadline ? new Date(job.deadline).toLocaleDateString() : "No deadline"}
                                    </p>
                                </div>
                            </div>

                            <div className={`flex items-start gap-3 p-3 rounded-lg ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'} border ${getBorderColor()}`}>
                                <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/10' : 'bg-purple-100'} ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                    <FiCalendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`text-sm ${getSecondaryTextColor()}`}>Openings</p>
                                    <p className={`font-medium ${getTextColor()}`}>
                                        {job.openings}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetails;