import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Tag,
  FileText,
  User,
  Folder,
  AlertCircle,
  CheckCircle,
  Circle,
  PlayCircle,
  XCircle,
  Loader,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  useGetTaskQuery,
  useDeleteTaskMutation,
  useUpdateTaskMutation,
} from '../../store/api/tasksApi';
import TaskModal from '../../components/Tasks/TaskModal';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: taskData, isLoading, refetch } = useGetTaskQuery(id);
  const [deleteTask] = useDeleteTaskMutation();
  const [updateTask] = useUpdateTaskMutation();

  const task = taskData?.task;

  const handleBack = () => {
    navigate('/tasks');
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id).unwrap();
        toast.success('Task deleted successfully');
        navigate('/tasks');
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateTask({
        id: task._id,
        status: newStatus,
      }).unwrap();
      toast.success(`Task marked as ${newStatus}`);
      refetch();
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'medium':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'urgent':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'cancelled':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Circle className="h-4 w-4" />;
      case 'in-progress':
        return <PlayCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: <Circle className="h-4 w-4" /> },
    { value: 'in-progress', label: 'In Progress', icon: <PlayCircle className="h-4 w-4" /> },
    { value: 'completed', label: 'Completed', icon: <CheckCircle className="h-4 w-4" /> },
    { value: 'cancelled', label: 'Cancelled', icon: <XCircle className="h-4 w-4" /> },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Task not found</h3>
        <p className="text-gray-600 mb-4">The task you're looking for doesn't exist or has been deleted.</p>
        <button onClick={handleBack} className="btn-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{task.name}</h1>
            <p className="text-gray-600">
              Created {format(new Date(task.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleEdit} className="btn-secondary">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button onClick={handleDelete} className="btn-danger">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Description */}
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
            {task.description ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No description provided</p>
            )}
          </div>

          {/* Notes */}
          {task.notes && (
            <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{task.notes}</p>
              </div>
            </div>
          )}

          {/* Linked Articles */}
          {task.linkedArticles && task.linkedArticles.length > 0 && (
            <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Linked Articles</h3>
              <div className="space-y-3">
                {task.linkedArticles.map((article) => (
                  <div
                    key={article._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-900">{article.title}</h4>
                        {article.excerpt && (
                          <p className="text-sm text-gray-600">{article.excerpt}</p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      article.status === 'published' ? 'bg-green-100 text-green-800' :
                      article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {article.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status & Priority</h3>
            
            {/* Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className={`flex items-center w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      task.status === option.value
                        ? getStatusColor(option.value)
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.icon}
                    <span className="ml-2">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <span className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            </div>
          </div>

          {/* Task Details */}
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
            <div className="space-y-4">
              {/* Collection */}
              {task.section && (
                <div className="flex items-center space-x-3">
                  <Folder className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Collection</p>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: task.section.color }}
                      />
                      <span className="text-sm text-gray-600">{task.section.name}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Due Date */}
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Due Date</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Estimated Time */}
              {task.estimatedTime && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Estimated Time</p>
                    <p className="text-sm text-gray-600">{task.estimatedTime} minutes</p>
                  </div>
                </div>
              )}

              {/* Actual Time */}
              {task.actualTime && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Actual Time</p>
                    <p className="text-sm text-gray-600">{task.actualTime} minutes</p>
                  </div>
                </div>
              )}

              {/* Completed At */}
              {task.completedAt && (
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Completed</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(task.completedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <TaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={task}
        onSuccess={() => {
          setIsEditModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default TaskDetail; 