import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Phone,
  Edit,
  Settings,
  CheckSquare,
  FileText,
  Clock,
  Target,
  TrendingUp,
  Award,
  Save,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useGetTaskStatsQuery } from '../../store/api/tasksApi';
import { useGetArticleStatsQuery } from '../../store/api/articlesApi';

const Profile = () => {
  const user = useSelector(selectCurrentUser);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || '',
  });

  // Get user statistics
  const { data: taskStats } = useGetTaskStatsQuery();
  const { data: articleStats } = useGetArticleStatsQuery();

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedProfile({
        name: user?.name || '',
        email: user?.email || '',
        bio: user?.bio || '',
        location: user?.location || '',
        phone: user?.phone || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      // Here you would typically make an API call to update the user profile
      // For now, we'll just show a success message
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const stats = [
    {
      label: 'Total Tasks',
      value: taskStats?.total || 0,
      icon: <CheckSquare className="h-5 w-5" />,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      label: 'Completed Tasks',
      value: taskStats?.completed || 0,
      icon: <Target className="h-5 w-5" />,
      color: 'text-green-600 bg-green-100',
    },
    {
      label: 'Total Articles',
      value: articleStats?.total || 0,
      icon: <FileText className="h-5 w-5" />,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      label: 'Published Articles',
      value: articleStats?.published || 0,
      icon: <Award className="h-5 w-5" />,
      color: 'text-orange-600 bg-orange-100',
    },
  ];

  const completionRate = taskStats?.total > 0 ? 
    Math.round((taskStats.completed / taskStats.total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>
        <button
          onClick={handleEditToggle}
          className={`btn-secondary ${isEditing ? 'bg-red-50 text-red-600 border-red-200' : ''}`}
        >
          {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              {isEditing && (
                <button
                  onClick={handleSave}
                  className="btn-primary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Profile Picture and Name */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-600" />
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="input text-lg font-medium"
                      placeholder="Your name"
                    />
                  ) : (
                    <h2 className="text-lg font-medium text-gray-900">{user?.name || 'User Name'}</h2>
                  )}
                  <p className="text-sm text-gray-600">
                    Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="input"
                      placeholder="your@email.com"
                    />
                  ) : (
                    <p className="text-gray-900">{user?.email || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedProfile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="input"
                      placeholder="Your phone number"
                    />
                  ) : (
                    <p className="text-gray-900">{user?.phone || 'Not provided'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Location
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="input"
                      placeholder="Your location"
                    />
                  ) : (
                    <p className="text-gray-900">{user?.location || 'Not provided'}</p>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={editedProfile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="input min-h-[100px]"
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {user?.bio || 'No bio provided'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Activity Overview */}
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Activity Overview</h3>
            
            {/* Completion Rate */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Task Completion Rate</span>
                <span className="text-sm font-medium text-gray-900">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span>Completed {taskStats?.completedThisWeek || 0} tasks this week</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Published {articleStats?.publishedThisMonth || 0} articles this month</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span>Last active {format(new Date(), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Statistics and Quick Actions */}
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
            <div className="space-y-4">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{stat.label}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">User ID</span>
                <span className="font-mono text-gray-900">{user?._id?.slice(-8) || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Account Type</span>
                <span className="text-gray-900">Standard</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center space-x-3">
                <Settings className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">Account Settings</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center space-x-3">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">View Analytics</span>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center space-x-3">
                <Award className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">Achievements</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 