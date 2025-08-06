import React from 'react';
import { CheckSquare } from 'lucide-react';

const Tasks = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <button className="btn-primary">
          <CheckSquare className="h-4 w-4 mr-2" />
          New Task
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first task.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Tasks; 