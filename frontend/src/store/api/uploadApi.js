import { api } from './apiSlice';

export const uploadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    uploadImage: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append('image', file);
        return {
          url: '/upload/image',
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
    }),
    uploadImages: builder.mutation({
      query: (files) => {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('images', file);
        });
        return {
          url: '/upload/images',
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
    }),
    deleteImage: builder.mutation({
      query: (publicId) => ({
        url: `/upload/image/${publicId}`,
        method: 'DELETE',
      }),
    }),
    getUploadSignature: builder.mutation({
      query: () => ({
        url: '/upload/signature',
        method: 'POST',
      }),
    }),
  }),
});

// Custom base query for file uploads
const uploadBaseQuery = async (args, api, extraOptions) => {
  const { url, method, body, formData } = args;
  
  const headers = new Headers();
  const token = api.getState().auth.token;
  
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }
  
  // Don't set content-type for FormData, let browser set it with boundary
  if (!formData) {
    headers.set('content-type', 'application/json');
  }

  try {
    const response = await fetch(`/api${url}`, {
      method,
      headers: formData ? { authorization: headers.get('authorization') || '' } : Object.fromEntries(headers),
      body: formData ? body : JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: { status: response.status, data } };
    }

    return { data };
  } catch (error) {
    return { error: { status: 'FETCH_ERROR', error: error.message } };
  }
};

// Helper function to upload image and return URL
export const uploadImageHelper = async (file, dispatch) => {
  try {
    const result = await dispatch(uploadApi.endpoints.uploadImage.initiate(file));
    if (result.data) {
      return result.data.image.url;
    }
    throw new Error('Upload failed');
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

export const {
  useUploadImageMutation,
  useUploadImagesMutation,
  useDeleteImageMutation,
  useGetUploadSignatureMutation,
} = uploadApi; 