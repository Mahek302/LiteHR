import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiSave,
  FiUpload,
  FiCheck,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiCalendar,
  FiShield,
  FiLock
} from "react-icons/fi";
import { useTheme, useThemeClasses } from "../../../contexts/ThemeContext";
import { uploadImage } from "../../../services/cloudinary.service";
import { toast } from "react-hot-toast";

const AdminProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const darkMode = useTheme() || false;
  const theme = useThemeClasses();

  const [profile, setProfile] = useState({
    personal: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      gender: "Male",
      profilePicture: null,
    },
      professional: {
        employeeId: "",
        designation: "",
      department: "",
      joiningDate: "",
      employmentType: "Full-time",
        reportingTo: "",
        role: "ADMIN",
      },
      security: {
        emailNotifications: true,
        twoFactorAuth: false,
        lastLogin: "N/A",
        lastPasswordChange: "N/A",
      }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/auth/getUser", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.email) {
        setProfile(prev => ({
          ...prev,
          personal: {
            ...prev.personal,
            email: res.data.email || "",
          },
          professional: {
            ...prev.professional,
            role: res.data.role || prev.professional.role,
          },
        }));
      }
      if (res.data?.employee) {
        const { email, employee, role } = res.data;
        setProfile(prev => ({
          ...prev,
          personal: {
            ...prev.personal,
            firstName: (employee.fullName || "").split(" ")[0] || "",
            lastName: (employee.fullName || "").split(" ").slice(1).join(" ") || "",
            email: email || "",
            phone: employee.phone || "",
            address: employee.address || employee.location || "",
            dateOfBirth: employee.dateOfBirth || "",
            gender: employee.gender || "Male",
            profilePicture: employee.profileImage || null,
          },
          professional: {
            ...prev.professional,
            employeeId: employee.employeeCode || "",
            designation: employee.designation || "",
            department: employee.department || "",
            joiningDate: employee.dateOfJoining || "",
            role: role || prev.professional.role,
          },
        }));
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
      toast.error("Failed to fetch profile");
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const fullName = `${profile.personal.firstName || ""} ${profile.personal.lastName || ""}`.trim();
      const payload = {
        name: fullName,
        email: profile.personal.email,
        phone: profile.personal.phone,
        personalEmail: profile.personal.email,
        dateOfBirth: profile.personal.dateOfBirth || null,
        gender: profile.personal.gender || null,
        address: profile.personal.address || null,
        location: profile.personal.address || null,
        department: profile.professional.department,
        position: profile.professional.designation,
        joiningDate: profile.professional.joiningDate,
        profileImage: profile.personal.profilePicture || null,
      };

      await axios.put("/api/auth/profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to save profile", err);
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchProfile(); // Reset to original
  };

  const handleProfilePictureView = () => {
    if (!isEditing && profile.personal.profilePicture) {
      window.open(profile.personal.profilePicture, '_blank');
    }
  };

  const handleChange = (category, field, value) => {
    setProfile({
      ...profile,
      [category]: {
        ...profile[category],
        [field]: value
      }
    });
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("File must be an image");
        return;
      }

      try {
        setLoading(true);
        const imageUrl = await uploadImage(file);
        setProfile(prev => ({
          ...prev,
          personal: {
            ...prev.personal,
            profilePicture: imageUrl
          }
        }));
      } catch (error) {
        console.error("Profile picture upload failed:", error);
        toast.error("Failed to upload profile picture: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper functions for theme
  const getBgColor = () => darkMode ? "bg-gray-800" : "bg-white";
  const getBorderColor = () => darkMode ? "border-gray-700" : "border-gray-200";
  const getTextColor = () => darkMode ? "text-white" : "text-gray-800";
  const getSecondaryTextColor = () => darkMode ? "text-gray-400" : "text-gray-600";
  const getInputBg = () => darkMode ? "bg-gray-900" : "bg-gray-50";
  const getCardBg = () => darkMode ? "bg-gray-700/50" : "bg-gray-100";

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${getTextColor()} mb-2`}>
            Admin Profile
          </h1>
          <p className={getSecondaryTextColor()}>
            Manage your personal information, professional details.
          </p>
        </div>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className={`px-4 py-2.5 ${getInputBg()} border ${getBorderColor()} ${getSecondaryTextColor()} rounded-lg hover:border-rose-500 hover:text-rose-300 font-medium transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                <FiSave className="w-4 h-4" />
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className={`flex flex-wrap gap-2 ${getBgColor()} p-1 rounded-lg w-fit border ${getBorderColor()}`}>
          {["profile", "professional", ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-md text-sm font-medium capitalize transition-all ${
                activeTab === tab
                  ? "bg-purple-600 text-white"
                  : `${getSecondaryTextColor()} hover:text-purple-600 hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`
              }`}
            >
              {tab === "profile" ? "Personal Info" : 
               tab === "professional" ? "Professional Details" : 
               "Security Settings"}
            </button>
          ))}
        </div>
      </div>

      {/* Personal Information Tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className={`${getBgColor()} rounded-xl p-6 border ${getBorderColor()} shadow-sm`}>
            <h3 className={`text-xl font-semibold ${getTextColor()} mb-6 flex items-center gap-2`}>
              <FiUser className="text-purple-500" />
              Personal Information
            </h3>

            {/* Profile Picture Upload */}
            <div className="mb-8">
              <label className={`block text-sm font-medium ${getTextColor()} mb-4`}>
                Profile Picture
              </label>
              <div className="flex items-center gap-6">
                <div
                  onClick={handleProfilePictureView}
                  className={`w-32 h-32 rounded-full border-2 border-dashed ${getBorderColor()} flex items-center justify-center overflow-hidden ${getInputBg()} ${
                    !isEditing && profile.personal.profilePicture 
                      ? 'cursor-pointer hover:border-purple-500 hover:opacity-90 transition-all' 
                      : ''
                  }`}
                >
                  {profile.personal.profilePicture ? (
                    <img
                      src={profile.personal.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <FiUser className="w-12 h-12 text-gray-500 mx-auto" />
                      <p className="text-xs text-gray-500 mt-1">No photo</p>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg cursor-pointer ${
                    isEditing
                      ? `${getInputBg()} border ${getBorderColor()} ${getSecondaryTextColor()} hover:border-purple-500 hover:text-purple-600`
                      : 'opacity-50 cursor-not-allowed border border-gray-300 bg-gray-100 text-gray-500'
                  } transition-colors`}>
                    <FiUpload className="w-5 h-5" />
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                      disabled={!isEditing}
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Recommended: Square image, PNG or JPG, max 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(profile.personal)
                .filter(([key]) => key !== 'profilePicture')
                .map(([key, value]) => (
                  <div key={key}>
                    <label className={`block text-sm font-medium ${getSecondaryTextColor()} mb-2 capitalize`}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    {isEditing ? (
                      key === 'gender' ? (
                        <select
                          value={value}
                          onChange={(e) => handleChange("personal", key, e.target.value)}
                          className={`w-full px-4 py-3 ${getInputBg()} border ${getBorderColor()} rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${getTextColor()} transition-all`}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : key === 'dateOfBirth' ? (
                        <input
                          type="date"
                          value={value}
                          onChange={(e) => handleChange("personal", key, e.target.value)}
                          className={`w-full px-4 py-3 ${getInputBg()} border ${getBorderColor()} rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${getTextColor()} transition-all`}
                        />
                      ) : (
                        <input
                          type={key === 'email' ? 'email' : 'text'}
                          value={value}
                          onChange={(e) => handleChange("personal", key, e.target.value)}
                          className={`w-full px-4 py-3 ${getInputBg()} border ${getBorderColor()} rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${getTextColor()} placeholder-gray-400 transition-all`}
                        />
                      )
                    ) : (
                      <div className={`px-4 py-3 ${getInputBg()} rounded-lg border ${getBorderColor()} flex items-center gap-2`}>
                        {key === 'email' && <FiMail className="text-purple-500" />}
                        {key === 'phone' && <FiPhone className="text-purple-500" />}
                        {key === 'address' && <FiMapPin className="text-purple-500" />}
                        <span className={getTextColor()}>{value}</span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Professional Details Tab */}
      {activeTab === "professional" && (
        <div className="space-y-6">
          <div className={`${getBgColor()} rounded-xl p-6 border ${getBorderColor()} shadow-sm`}>
            <h3 className={`text-xl font-semibold ${getTextColor()} mb-6 flex items-center gap-2`}>
              <FiBriefcase className="text-purple-500" />
              Professional Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(profile.professional).map(([key, value]) => (
                <div key={key}>
                  <label className={`block text-sm font-medium ${getSecondaryTextColor()} mb-2 capitalize`}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  {isEditing && key !== 'employeeId' && key !== 'role' ? (
                    key === 'joiningDate' ? (
                      <input
                        type="date"
                        value={value}
                        onChange={(e) => handleChange("professional", key, e.target.value)}
                        className={`w-full px-4 py-3 ${getInputBg()} border ${getBorderColor()} rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${getTextColor()} transition-all`}
                      />
                    ) : key === 'employmentType' ? (
                      <select
                        value={value}
                        onChange={(e) => handleChange("professional", key, e.target.value)}
                        className={`w-full px-4 py-3 ${getInputBg()} border ${getBorderColor()} rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${getTextColor()} transition-all`}
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Intern">Intern</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleChange("professional", key, e.target.value)}
                        className={`w-full px-4 py-3 ${getInputBg()} border ${getBorderColor()} rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 ${getTextColor()} transition-all`}
                      />
                    )
                  ) : (
                    <div className={`px-4 py-3 ${getInputBg()} rounded-lg border ${getBorderColor()} flex items-center gap-2`}>
                      {key === 'employeeId' && <FiShield className="text-purple-500" />}
                      <span className={getTextColor()}>{value}</span>
                      {key === 'role' && (
                        <span className="ml-auto px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                          Admin
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Settings Tab */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className={`${getBgColor()} rounded-xl p-6 border ${getBorderColor()} shadow-sm`}>
            <h3 className={`text-xl font-semibold ${getTextColor()} mb-6 flex items-center gap-2`}>
              <FiLock className="text-purple-500" />
              Security Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Notifications */}
              <div className={`p-4 ${getInputBg()} rounded-lg border ${getBorderColor()}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${getTextColor()}`}>Email Notifications</p>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>Receive email alerts for system events</p>
                  </div>
                  {isEditing ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.security.emailNotifications}
                        onChange={(e) => handleChange("security", "emailNotifications", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      profile.security.emailNotifications 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {profile.security.emailNotifications ? 'Enabled' : 'Disabled'}
                    </span>
                  )}
                </div>
              </div>

              {/* Two Factor Authentication */}
              <div className={`p-4 ${getInputBg()} rounded-lg border ${getBorderColor()}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${getTextColor()}`}>Two-Factor Authentication</p>
                    <p className={`text-sm ${getSecondaryTextColor()}`}>Add extra security to your account</p>
                  </div>
                  {isEditing ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.security.twoFactorAuth}
                        onChange={(e) => handleChange("security", "twoFactorAuth", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      profile.security.twoFactorAuth 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {profile.security.twoFactorAuth ? 'Enabled' : 'Disabled'}
                    </span>
                  )}
                </div>
              </div>

              {/* Last Login */}
              <div className={`p-4 ${getInputBg()} rounded-lg border ${getBorderColor()}`}>
                <p className={`text-sm ${getSecondaryTextColor()}`}>Last Login</p>
                <p className={`text-lg font-semibold ${getTextColor()}`}>{profile.security.lastLogin}</p>
              </div>

              {/* Last Password Change */}
              <div className={`p-4 ${getInputBg()} rounded-lg border ${getBorderColor()}`}>
                <p className={`text-sm ${getSecondaryTextColor()}`}>Last Password Change</p>
                <p className={`text-lg font-semibold ${getTextColor()}`}>{profile.security.lastPasswordChange}</p>
              </div>
            </div>

            {/* Change Password Button */}
            {isEditing && (
              <div className="mt-6">
                <button className="flex items-center gap-2 px-4 py-3 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors border border-purple-500/30">
                  <FiLock className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            )}
          </div>

          {/* Activity Summary */}
          <div className={`${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'} border ${darkMode ? 'border-purple-500/30' : 'border-purple-200'} rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-700'} mb-4`}>Account Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`${darkMode ? 'bg-gray-900/50' : 'bg-white/80'} backdrop-blur-sm p-4 rounded-xl border ${getBorderColor()}`}>
                <p className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>Account Age</p>
                <p className={`text-2xl font-bold ${getTextColor()}`}>1 year</p>
              </div>
              <div className={`${darkMode ? 'bg-gray-900/50' : 'bg-white/80'} backdrop-blur-sm p-4 rounded-xl border ${getBorderColor()}`}>
                <p className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>Total Logins</p>
                <p className={`text-2xl font-bold ${getTextColor()}`}>156</p>
              </div>
              <div className={`${darkMode ? 'bg-gray-900/50' : 'bg-white/80'} backdrop-blur-sm p-4 rounded-xl border ${getBorderColor()}`}>
                <p className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>Security Score</p>
                <p className={`text-2xl font-bold text-emerald-500`}>85%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save/Cancel Buttons (Bottom) */}
      {isEditing && (
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className={`px-6 py-3 ${getInputBg()} border ${getBorderColor()} ${getSecondaryTextColor()} rounded-lg hover:border-rose-500 hover:text-rose-300 font-medium transition-colors`}
          >
            Discard Changes
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <FiSave className="w-5 h-5" />
            Save All Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
