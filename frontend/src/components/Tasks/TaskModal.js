import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar, Clock, Tag, FileText, Loader } from 'lucide-react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import toast from 'react-hot-toast';
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from '../../store/api/tasksApi';
import { useGetSectionsQuery } from '../../store/api/sectionsApi';
import { useGetArticlesQuery } from '../../store/api/articlesApi';
import 'react-datepicker/dist/react-datepicker.css';

const TaskModal = ({ isOpen, onClose, task = null, onSuccess }) => {
  const isEditing = Boolean(task);
  const [dueDate, setDueDate] = useState(new Date());
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedArticles, setSelectedArticles] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      notes: '',
      priority: 'medium',
      status: 'pending',
      section: '',
      estimatedTime: '',
    },
  });

  // API hooks
  const { data: sectionsData } = useGetSectionsQuery();
  const { data: articlesData } = useGetArticlesQuery({ limit: 100 });
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      reset({
        name: task.name,
        description: task.description || '',
        notes: task.notes || '',
        priority: task.priority,
        status: task.status,
        section: task.section._id || task.section,
        estimatedTime: task.estimatedTime || '',
      });
      setDueDate(new Date(task.dueDate));
      
      if (task.tags) {
        setSelectedTags(task.tags.map(tag => ({ value: tag, label: tag })));
      }
      
      if (task.linkedArticles) {
        setSelectedArticles(
          task.linkedArticles.map(article => ({
            value: article._id,
            label: article.title,
          }))
        );
      }
    } else {
      reset({
        name: '',
        description: '',
        notes: '',
        priority: 'medium',
        status: 'pending',
        section: '',
        estimatedTime: '',
      });
      setDueDate(new Date());
      setSelectedTags([]);
      setSelectedArticles([]);
    }
  }, [task, reset]);

  const onSubmit = async (data) => {
    try {
      const taskData = {
        ...data,
        dueDate: dueDate.toISOString(),
        tags: selectedTags.map(tag => tag.value),
        linkedArticles: selectedArticles.map(article => article.value),
      };

      if (isEditing) {
        await updateTask({ id: task._id, ...taskData }).unwrap();
        toast.success('Task updated successfully');
      } else {
        await createTask(taskData).unwrap();
        toast.success('Task created successfully');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.data?.message || 'Failed to save task');
    }
  };

  // Prepare options for selects
  const sectionOptions = sectionsData?.sections?.map(section => ({
    value: section._id,
    label: section.name,
  })) || [];

  const articleOptions = articlesData?.articles?.map(article => ({
    value: article._id,
    label: article.title,
  })) || [];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'text-blue-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'text-gray-600' },
    { value: 'in-progress', label: 'In Progress', color: 'text-blue-600' },
    { value: 'completed', label: 'Completed', color: 'text-green-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-600' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Edit Task' : 'Create New Task'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
            {/* Task Name */}
            <div>
              <label className="label">Task Name *</label>
              <input
                {...register('name', { required: 'Task name is required' })}
                type="text"
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter task name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-danger-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="label">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="input"
                placeholder="Brief description of the task..."
              />
            </div>

            {/* Section and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Section *</label>
                <select
                  {...register('section', { required: 'Section is required' })}
                  className={`input ${errors.section ? 'input-error' : ''}`}
                >
                  <option value="">Select a section</option>
                  {sectionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.section && (
                  <p className="mt-1 text-sm text-danger-600">
                    {errors.section.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Due Date *</label>
                <DatePicker
                  selected={dueDate}
                  onChange={setDueDate}
                  showTimeSelect
                  dateFormat="MMM d, yyyy h:mm aa"
                  className="input"
                  placeholderText="Select due date"
                />
              </div>
            </div>

            {/* Priority and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Priority</label>
                <select
                  {...register('priority')}
                  className="input"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  {...register('status')}
                  className="input"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Estimated Time */}
            <div>
              <label className="label">Estimated Time (minutes)</label>
              <input
                {...register('estimatedTime')}
                type="number"
                min="0"
                className="input"
                placeholder="e.g., 30"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="label">Tags</label>
              <Select
                value={selectedTags}
                onChange={setSelectedTags}
                isMulti
                isCreatable
                placeholder="Add tags..."
                className="react-select-container"
                classNamePrefix="react-select"
                formatCreateLabel={(inputValue) => `Create tag "${inputValue}"`}
              />
            </div>

            {/* Linked Articles */}
            <div>
              <label className="label">Linked Articles</label>
              <Select
                options={articleOptions}
                value={selectedArticles}
                onChange={setSelectedArticles}
                isMulti
                placeholder="Link to articles..."
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes</label>
              <textarea
                {...register('notes')}
                rows={4}
                className="input"
                placeholder="Additional notes or details..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || isUpdating}
                className="btn-primary"
              >
                {isCreating || isUpdating ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditing ? 'Update Task' : 'Create Task'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal; 