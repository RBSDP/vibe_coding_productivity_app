import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Folder, Palette, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useCreateSectionMutation,
  useUpdateSectionMutation,
} from '../../store/api/sectionsApi';

const CollectionModal = ({ isOpen, onClose, collection = null, onSuccess }) => {
  const isEditing = Boolean(collection);
  const [selectedColor, setSelectedColor] = useState('#3b82f6');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      icon: 'folder',
    },
  });

  const [createSection, { isLoading: isCreating }] = useCreateSectionMutation();
  const [updateSection, { isLoading: isUpdating }] = useUpdateSectionMutation();

  // Color options for collections
  const colorOptions = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Gray', value: '#6b7280' },
  ];

  const iconOptions = [
    { name: 'Folder', value: 'folder' },
    { name: 'Work', value: 'briefcase' },
    { name: 'Home', value: 'home' },
    { name: 'Sports', value: 'activity' },
    { name: 'Study', value: 'book' },
    { name: 'Health', value: 'heart' },
    { name: 'Shopping', value: 'shopping-cart' },
    { name: 'Travel', value: 'map-pin' },
    { name: 'Code', value: 'code' },
    { name: 'Star', value: 'star' },
  ];

  // Reset form when collection changes
  useEffect(() => {
    if (collection) {
      reset({
        name: collection.name,
        description: collection.description || '',
        icon: collection.icon || 'folder',
      });
      setSelectedColor(collection.color || '#3b82f6');
    } else {
      reset({
        name: '',
        description: '',
        icon: 'folder',
      });
      setSelectedColor('#3b82f6');
    }
  }, [collection, reset]);

  const onSubmit = async (data) => {
    try {
      const collectionData = {
        ...data,
        color: selectedColor,
      };

      if (isEditing) {
        await updateSection({ id: collection._id, ...collectionData }).unwrap();
        toast.success('Collection updated successfully');
      } else {
        await createSection(collectionData).unwrap();
        toast.success('Collection created successfully');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.data?.message || 'Failed to save collection');
    }
  };

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
        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Edit Collection' : 'Create New Collection'}
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
            {/* Collection Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Name *
              </label>
              <input
                {...register('name', { required: 'Collection name is required' })}
                type="text"
                className={`block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.name ? 'border-red-300' : ''}`}
                placeholder="e.g., Work Projects, Personal, Sports"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Brief description of this collection..."
              />
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color.value
                        ? 'border-gray-800 scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <select
                {...register('icon')}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {iconOptions.map((icon) => (
                  <option key={icon.value} value={icon.value}>
                    {icon.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedColor }}
                />
                <Folder className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  {register('name').value || 'Collection Name'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || isUpdating}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating || isUpdating ? (
                  <>
                    <Hash className="animate-spin h-4 w-4 mr-2" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditing ? 'Update Collection' : 'Create Collection'}
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

export default CollectionModal; 