import React from 'react';
import { useGetSectionsQuery, useCreateSectionMutation } from '../../store/api/sectionsApi';
import { useGetTasksQuery } from '../../store/api/tasksApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const DebugInfo = () => {
  const user = useSelector(selectCurrentUser);
  const { data: sectionsData, isLoading: sectionsLoading, error: sectionsError } = useGetSectionsQuery();
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useGetTasksQuery();
  const [createSection, { isLoading: isCreatingSection }] = useCreateSectionMutation();

  const handleCreateDefaultSection = async () => {
    try {
      await createSection({
        name: 'General',
        description: 'Default section for tasks',
        color: '#3b82f6',
        icon: 'folder'
      }).unwrap();
      toast.success('Default section created!');
    } catch (error) {
      toast.error('Failed to create section: ' + (error.data?.message || error.message));
      console.error('Create section error:', error);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Info</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>User:</strong> {user ? `${user.username} (${user.email})` : 'Not logged in'}
        </div>
        
        <div>
          <strong>Sections:</strong> 
          {sectionsLoading && ' Loading...'}
          {sectionsError && ` Error: ${JSON.stringify(sectionsError)}`}
          {sectionsData && ` ${sectionsData.sections?.length || 0} sections found`}
          {sectionsData?.sections?.length > 0 && (
            <ul className="ml-4 mt-1">
              {sectionsData.sections.map(section => (
                <li key={section._id}>- {section.name} ({section._id})</li>
              ))}
            </ul>
          )}
          {sectionsData?.sections?.length === 0 && (
            <div className="mt-2">
              <button
                onClick={handleCreateDefaultSection}
                disabled={isCreatingSection}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isCreatingSection ? 'Creating...' : 'Create Default Section'}
              </button>
            </div>
          )}
        </div>
        
        <div>
          <strong>Tasks:</strong> 
          {tasksLoading && ' Loading...'}
          {tasksError && ` Error: ${JSON.stringify(tasksError)}`}
          {tasksData && ` ${tasksData.tasks?.length || 0} tasks found`}
        </div>

        <div>
          <strong>API Base URL:</strong> {window.location.origin}/api
        </div>
        
        <div>
          <strong>Environment:</strong> {process.env.NODE_ENV || 'development'}
        </div>
      </div>
    </div>
  );
};

export default DebugInfo; 