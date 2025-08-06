import { api } from './apiSlice';

export const sectionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSections: builder.query({
      query: (params = {}) => ({
        url: '/sections',
        params,
      }),
      providesTags: ['Section'],
    }),
    getSection: builder.query({
      query: (id) => `/sections/${id}`,
      providesTags: (result, error, id) => [{ type: 'Section', id }],
    }),
    createSection: builder.mutation({
      query: (sectionData) => ({
        url: '/sections',
        method: 'POST',
        body: sectionData,
      }),
      invalidatesTags: ['Section'],
    }),
    updateSection: builder.mutation({
      query: ({ id, ...sectionData }) => ({
        url: `/sections/${id}`,
        method: 'PUT',
        body: sectionData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Section', id }],
    }),
    deleteSection: builder.mutation({
      query: (id) => ({
        url: `/sections/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Section'],
    }),
    archiveSection: builder.mutation({
      query: ({ id, archive }) => ({
        url: `/sections/${id}/archive`,
        method: 'PATCH',
        body: { archive },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Section', id }],
    }),
    getSectionStats: builder.query({
      query: (id) => `/sections/${id}/stats`,
      providesTags: (result, error, id) => [{ type: 'Section', id }],
    }),
  }),
});

export const {
  useGetSectionsQuery,
  useGetSectionQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
  useArchiveSectionMutation,
  useGetSectionStatsQuery,
} = sectionsApi; 