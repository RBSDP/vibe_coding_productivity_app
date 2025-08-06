import { api } from './apiSlice';

export const articlesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getArticles: builder.query({
      query: (params = {}) => ({
        url: '/articles',
        params,
      }),
      providesTags: ['Article'],
    }),
    getArticle: builder.query({
      query: ({ identifier, increment_views = false }) => ({
        url: `/articles/${identifier}`,
        params: { increment_views },
      }),
      providesTags: (result, error, { identifier }) => [
        { type: 'Article', id: identifier },
      ],
    }),
    createArticle: builder.mutation({
      query: (articleData) => ({
        url: '/articles',
        method: 'POST',
        body: articleData,
      }),
      invalidatesTags: ['Article'],
    }),
    updateArticle: builder.mutation({
      query: ({ id, ...articleData }) => ({
        url: `/articles/${id}`,
        method: 'PUT',
        body: articleData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Article', id },
        'Article',
      ],
    }),
    deleteArticle: builder.mutation({
      query: (id) => ({
        url: `/articles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Article'],
    }),
    getArticleStats: builder.query({
      query: () => '/articles/stats/overview',
      providesTags: ['Article'],
    }),
    searchArticles: builder.mutation({
      query: (searchData) => ({
        url: '/articles/search',
        method: 'POST',
        body: searchData,
      }),
    }),
    getCategoriesAndTags: builder.query({
      query: () => '/articles/meta/categories-tags',
      providesTags: ['Article'],
    }),
  }),
});

export const {
  useGetArticlesQuery,
  useGetArticleQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
  useGetArticleStatsQuery,
  useSearchArticlesMutation,
  useGetCategoriesAndTagsQuery,
} = articlesApi; 