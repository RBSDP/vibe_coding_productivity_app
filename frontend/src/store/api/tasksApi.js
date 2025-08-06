import { api } from './apiSlice';

export const tasksApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query({
      query: (params = {}) => ({
        url: '/tasks',
        params,
      }),
      providesTags: ['Task'],
    }),
    getTask: builder.query({
      query: (id) => `/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),
    createTask: builder.mutation({
      query: (taskData) => ({
        url: '/tasks',
        method: 'POST',
        body: taskData,
      }),
      invalidatesTags: ['Task', 'Section'],
    }),
    updateTask: builder.mutation({
      query: ({ id, ...taskData }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: taskData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Task', id },
        'Task',
        'Section',
      ],
    }),
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task', 'Section'],
    }),
    getTaskStats: builder.query({
      query: (params = {}) => ({
        url: '/tasks/stats/overview',
        params,
      }),
      providesTags: ['Task'],
    }),
    bulkUpdateTasks: builder.mutation({
      query: ({ taskIds, updates }) => ({
        url: '/tasks/bulk',
        method: 'PATCH',
        body: { taskIds, updates },
      }),
      invalidatesTags: ['Task', 'Section'],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetTaskStatsQuery,
  useBulkUpdateTasksMutation,
} = tasksApi; 