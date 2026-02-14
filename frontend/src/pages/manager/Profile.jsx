// src/pages/manager/Profile.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Save,
  Mail,
  Phone,
  Building,
  Calendar,
  Briefcase,
  Camera,
  X
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useOutletContext();
  const fileInputRef = useRef(null);

  const themeColors = isDarkMode ? {
    primary: '#8b5cf6',
    accent: '#3b82f6',
    background: '#0f172a',
    card: '#1e293b',
    text: '#f9fafb',
    muted: '#9ca3af',
    border: '#374151',
    hover: 'rgba(59,130,246,0.1)',
  } : {
    primary: '#2563eb',
    accent: '#2563eb',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    muted: '#64748b',
    border: '#e2e8f0',
    hover: '#f1f5f9',
  };

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    joiningDate: '',
    bio: '',
    profileImage: null,
    profileImageUrl: '' // For displaying the uploaded image
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/getUser', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data) {
          const { email, employee } = res.data;
          setProfileData(prev => ({
            ...prev,
            email: email || '',
            name: employee?.fullName || '',
            phone: employee?.phone || '',
            department: employee?.department || '',
            position: employee?.designation || '',
            joiningDate: employee?.dateOfJoining || '',
            profileImageUrl: employee?.profileImage || ''
          }));
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Create URL for preview
    const imageUrl = URL.createObjectURL(file);

    setProfileData(prev => ({
      ...prev,
      profileImage: file,
      profileImageUrl: imageUrl
    }));
  };

  const removeImage = () => {
    if (profileData.profileImageUrl && profileData.profileImage) {
      URL.revokeObjectURL(profileData.profileImageUrl);
    }

    setProfileData(prev => ({
      ...prev,
      profileImage: null,
      profileImageUrl: ''
    }));

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadProfileImage = async () => {
    if (!profileData.profileImage) return null;

    setUploadingImage(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profileImage', profileData.profileImage);

      const response = await axios.post('/api/auth/upload-profile-image', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.imageUrl;
    } catch (err) {
      console.error("Failed to upload image", err);
      alert(err.response?.data?.message || 'Failed to upload profile image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');

      // Upload profile image first if exists
      let profileImageUrl = profileData.profileImageUrl;
      if (profileData.profileImage) {
        const uploadedUrl = await uploadProfileImage();
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
        }
      }

      const payload = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        department: profileData.department,
        position: profileData.position,
        joiningDate: profileData.joiningDate,
        bio: profileData.bio,
        profileImage: profileImageUrl
      };

      await axios.put('/api/auth/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Profile saved successfully!');

      // Refresh the page to show updated image
      if (profileData.profileImage) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to save profile", err);
      alert(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Define the form fields with proper icon rendering
  const formFields = [
    {
      name: 'name',
      label: 'Full Name',
      icon: <User size={14} className="inline mr-1" />,
      type: 'text'
    },
    {
      name: 'email',
      label: 'Email Address',
      icon: <Mail size={14} className="inline mr-1" />,
      type: 'email'
    },
    {
      name: 'phone',
      label: 'Phone Number',
      icon: <Phone size={14} className="inline mr-1" />,
      type: 'tel'
    },
    {
      name: 'department',
      label: 'Department',
      icon: <Building size={14} className="inline mr-1" />,
      type: 'text'
    },
    {
      name: 'position',
      label: 'Position',
      icon: <Briefcase size={14} className="inline mr-1" />,
      type: 'text'
    },
    {
      name: 'joiningDate',
      label: 'Joining Date',
      icon: <Calendar size={14} className="inline mr-1" />,
      type: 'date'
    },
  ];

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: themeColors.background }}>
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/manager/dashboard')}
          className="p-2 rounded-lg cursor-pointer inline-flex items-center gap-2"
          style={{ backgroundColor: themeColors.hover, color: themeColors.text }}
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Main Profile Card */}
        <div
          className="rounded-xl shadow-sm overflow-hidden"
          style={{
            backgroundColor: themeColors.card,
            border: `1px solid ${themeColors.border}`
          }}
        >
          {/* Header */}
          <div className="p-6 border-b" style={{ borderColor: themeColors.border }}>
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: themeColors.hover }}
              >
                <User size={24} style={{ color: themeColors.accent }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: themeColors.text }}>
                  Profile
                </h1>
                <p className="text-sm" style={{ color: themeColors.muted }}>
                  Manage your profile information
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Profile Image Section */}
              <div className="flex items-start gap-6">
                <div className="relative group">
                  <div className="relative">
                    {profileData.profileImageUrl ? (
                      <div className="relative">
                        <img
                          src={profileData.profileImageUrl}
                          alt="Profile"
                          className="w-32 h-32 rounded-full object-cover border-4"
                          style={{ borderColor: themeColors.card }}
                        />
                        <button
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="w-32 h-32 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4"
                        style={{
                          background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.primary})`,
                          borderColor: themeColors.card
                        }}
                      >
                        {profileData.name ? profileData.name.substring(0, 2).toUpperCase() : 'PR'}
                      </div>
                    )}

                    {/* Upload Button */}
                    <button
                      onClick={() => fileInputRef.current.click()}
                      disabled={uploadingImage}
                      className="absolute bottom-2 right-2 p-2.5 rounded-full shadow-lg transition-all hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: themeColors.primary,
                        color: 'white'
                      }}
                      title="Upload profile image"
                    >
                      {uploadingImage ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera size={16} />
                      )}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  <p className="text-xs mt-2 text-center" style={{ color: themeColors.muted }}>
                    Click camera icon to upload
                    <br />
                    Max size: 5MB
                  </p>
                </div>

                {/* Profile Info Summary */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>
                    {profileData.name || 'Your Name'}
                  </h2>
                  <p style={{ color: themeColors.muted }}>
                    {profileData.position || 'Position'}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: themeColors.muted }}>
                    <span className="flex items-center gap-1">
                      <Building size={12} />
                      {profileData.department || 'Department'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Joined {profileData.joiningDate ? new Date(profileData.joiningDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  {profileData.profileImage && (
                    <div className="mt-3 p-2 rounded text-xs"
                      style={{
                        backgroundColor: `${themeColors.primary}20`,
                        border: `1px solid ${themeColors.primary}`
                      }}>
                      <p className="flex items-center gap-1">
                        <Camera size={10} />
                        <span style={{ color: themeColors.primary }}>
                          New image selected. Click "Save Changes" to upload.
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formFields.map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>
                      {field.icon}
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={profileData[field.name]}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                        border: `1px solid ${themeColors.border}`
                      }}
                    />
                  </div>
                ))}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>
                    Bio / Description
                  </label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    rows="4"
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                      border: `1px solid ${themeColors.border}`
                    }}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t" style={{ borderColor: themeColors.border }}>
                <button
                  type="button"
                  onClick={() => navigate('/manager/dashboard')}
                  className="px-6 py-2.5 border rounded-lg font-medium transition-all hover:opacity-80 cursor-pointer"
                  style={{ borderColor: themeColors.border, color: themeColors.text }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || uploadingImage}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: themeColors.primary
                  }}
                >
                  {saving || uploadingImage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {uploadingImage ? 'Uploading...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;