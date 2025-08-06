import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateTaskMutation } from '../../store/api/tasksApi';
import { useGetSectionsQuery, useCreateSectionMutation } from '../../store/api/sectionsApi';
import CollectionModal from '../Collections/CollectionModal';

const SimpleTaskModal = ({ isOpen, onClose, onSuccess }) => {
  const [taskName, setTaskName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 16));
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);

  const { data: sectionsData, refetch: refetchSections } = useGetSectionsQuery();
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const [createSection] = useCreateSectionMutation();

  const sections = sectionsData?.sections || [];

  // Find or create "General" section
  const generalSection = sections.find(s => s.name.toLowerCase() === 'general');

  // Auto-create General section if it doesn't exist
  useEffect(() => {
    const createGeneralSection = async () => {
      if (sections.length === 0 || !generalSection) {
        try {
          await createSection({
            name: 'General',
            description: 'Default collection for general tasks',
            color: '#6b7280',
            icon: 'folder'
          }).unwrap();
          refetchSections();
        } catch (error) {
          console.log('General section might already exist or user not logged in');
        }
      }
    };

    if (isOpen && sectionsData) {
      createGeneralSection();
    }
  }, [isOpen, sectionsData, sections.length, generalSection, createSection, refetchSections]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!taskName.trim()) {
      toast.error('Task name is required');
      return;
    }

    // Use selected section or default to General section
    let sectionId = selectedSection;
    if (!sectionId) {
      const defaultSection = generalSection || sections[0];
      if (!defaultSection) {
        toast.error('No collections available. Please create a collection first.');
        return;
      }
      sectionId = defaultSection._id;
    }

    try {
      await createTask({
        name: taskName,
        section: sectionId,
        dueDate: new Date(dueDate).toISOString(),
        priority: 'medium',
        status: 'pending'
      }).unwrap();
      
      toast.success('Task created successfully');
      setTaskName('');
      setSelectedSection('');
      setDueDate(new Date().toISOString().slice(0, 16));
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Failed to create task: ' + (error.data?.message || error.message));
      console.error('Create task error:', error);
    }
  };

  const handleCreateCollection = () => {
    setIsCollectionModalOpen(true);
  };

  const handleCollectionCreated = () => {
    refetchSections();
    setIsCollectionModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
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
                Create New Task
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {/* Task Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Name *
                </label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter task name"
                  required
                />
              </div>

              {/* Collection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Collection
                  </label>
                  <button
                    type="button"
                    onClick={handleCreateCollection}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New Collection
                  </button>
                </div>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">General (Default)</option>
                  {sections.map(section => (
                    <option key={section._id} value={section._id}>
                      {section.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedSection ? 
                    `Task will be added to ${sections.find(s => s._id === selectedSection)?.name || 'selected collection'}` :
                    'Task will be added to General collection'
                  }
                </p>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
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
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Collection Modal */}
      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        onSuccess={handleCollectionCreated}
      />
    </>
  );
};

export default SimpleTaskModal; 