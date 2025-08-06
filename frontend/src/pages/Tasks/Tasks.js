import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Tag,
  FileText,
  MoreVertical,
  Eye,
  Folder,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  useGetTasksQuery,
  useDeleteTaskMutation,
  useUpdateTaskMutation,
} from '../../store/api/tasksApi';
import { useGetSectionsQuery } from '../../store/api/sectionsApi';
import TaskModal from '../../components/Tasks/TaskModal';
import SimpleTaskModal from '../../components/Tasks/SimpleTaskModal';
import CollectionModal from '../../components/Collections/CollectionModal';

const Tasks = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingCollection, setEditingCollection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Build query parameters
  const queryParams = {
    ...(searchTerm && { search: searchTerm }),
    ...(selectedSection && { section: selectedSection }),
    ...(selectedStatus && { status: selectedStatus }),
    ...(selectedPriority && { priority: selectedPriority }),
    sortBy,
    sortOrder,
    limit: 50,
  };

  const { data: tasksData, isLoading, refetch } = useGetTasksQuery(queryParams);
  const { data: sectionsData, refetch: refetchSections } = useGetSectionsQuery();
  const [deleteTask] = useDeleteTaskMutation();
  const [updateTask] = useUpdateTaskMutation();

  const tasks = tasksData?.tasks || [];
  const sections = sectionsData?.sections || [];

  const handleCreateTask = () => {
    console.log('Create task button clicked');
    setEditingTask(null);
    setIsModalOpen(true);
    console.log('Modal state set to true');
  };

  const handleCreateCollection = () => {
    setEditingCollection(null);
    setIsCollectionModalOpen(true);
  };

  const handleEditCollection = (collection) => {
    setEditingCollection(collection);
    setIsCollectionModalOpen(true);
  };

  const handleCollectionSuccess = () => {
    refetchSections();
    setIsCollectionModalOpen(false);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId).unwrap();
        toast.success('Task deleted successfully');
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await updateTask({
        id: task._id,
        status: newStatus,
      }).unwrap();
      toast.success(`Task marked as ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'text-gray-600 bg-gray-100';
      case 'medium':
        return 'text-blue-600 bg-blue-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'urgent':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-gray-600 bg-gray-100';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const isOverdue = (dueDate, status) => {
    return new Date(dueDate) < new Date() && status !== 'completed' && status !== 'cancelled';
  };

  const TaskCard = ({ task }) => (
    <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-4 hover:shadow-medium transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Task Header */}
          <div className="flex items-center space-x-2 mb-2">
            <button
              onClick={() => handleStatusChange(
                task,
                task.status === 'completed' ? 'pending' : 'completed'
              )}
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                task.status === 'completed'
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 hover:border-green-500'
              }`}
            >
              {task.status === 'completed' && <CheckSquare className="h-3 w-3" />}
            </button>
            
            <Link
              to={`/tasks/${task._id}`}
              className={`font-medium hover:text-primary-600 transition-colors ${
                task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
              }`}
            >
              {task.name}
            </Link>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {/* Section */}
            <div className="flex items-center space-x-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: task.section.color }}
              />
              <span>{task.section.name}</span>
            </div>

            {/* Due Date */}
            <div className={`flex items-center space-x-1 ${
              isOverdue(task.dueDate, task.status) ? 'text-red-600' : ''
            }`}>
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
            </div>

            {/* Estimated Time */}
            {task.estimatedTime && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{task.estimatedTime}m</span>
              </div>
            )}

            {/* Linked Articles Count */}
            {task.linkedArticles && task.linkedArticles.length > 0 && (
              <div className="flex items-center space-x-1">
                <FileText className="h-3 w-3" />
                <span>{task.linkedArticles.length}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                >
                  <Tag className="h-2 w-2 mr-1" />
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{task.tags.length - 3} more</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {/* Priority Badge */}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>

          {/* Status Badge */}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
            {task.status}
          </span>

          {/* More Actions */}
          <div className="relative group">
            <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
              <MoreVertical className="h-4 w-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <Link
                to={`/tasks/${task._id}`}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Link>
              <button
                onClick={() => handleEditTask(task)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </button>
              <button
                onClick={() => handleDeleteTask(task._id)}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            {tasksData?.pagination?.totalCount && tasksData.pagination.totalCount !== tasks.length &&
              ` of ${tasksData.pagination.totalCount}`
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCreateCollection}
            className="btn-secondary"
          >
            <Folder className="h-4 w-4 mr-2" />
            New Collection
          </button>
          <button
            onClick={handleCreateTask}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Collections Overview */}
      {sections.length > 0 && (
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Collections</h3>
            <span className="text-xs text-gray-500">{sections.length} collection{sections.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section._id}
                onClick={() => setSelectedSection(selectedSection === section._id ? '' : section._id)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedSection === section._id
                    ? 'bg-primary-100 text-primary-800 ring-2 ring-primary-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: section.color }}
                />
                {section.name}
                <span className="ml-1 text-gray-500">
                  ({tasks.filter(t => t.section._id === section._id).length})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-4">
        <div className="flex items-center space-x-4 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'bg-primary-50 text-primary-700' : ''}`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="input py-2"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="dueDate-asc">Due Date (Soon)</option>
            <option value="dueDate-desc">Due Date (Later)</option>
            <option value="priority-desc">Priority (High)</option>
            <option value="name-asc">Name (A-Z)</option>
          </select>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="label">Collection</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="input"
              >
                <option value="">All Collections</option>
                {sections.map(section => (
                  <option key={section._id} value={section._id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="label">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="input"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-12">
          <div className="text-center">
            <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || selectedSection || selectedStatus || selectedPriority
                ? 'No tasks match your filters'
                : 'No tasks yet'
              }
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedSection || selectedStatus || selectedPriority
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first task.'
              }
            </p>
            {!searchTerm && !selectedSection && !selectedStatus && !selectedPriority && (
              <div className="mt-6">
                <button
                  onClick={handleCreateTask}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Modal */}
      <SimpleTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Collection Modal */}
      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        collection={editingCollection}
        onSuccess={handleCollectionSuccess}
      />
    </div>
  );
};

export default Tasks; 