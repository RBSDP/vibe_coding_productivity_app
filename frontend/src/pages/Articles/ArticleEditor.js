import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Save, Eye, ArrowLeft, Loader, Upload, X } from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import RichTextEditor from '../../components/Editor/RichTextEditor';
import {
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useGetArticleQuery,
  useGetCategoriesAndTagsQuery,
  useGetArticlesQuery,
} from '../../store/api/articlesApi';
import { useUploadImageMutation } from '../../store/api/uploadApi';

const ArticleEditor = () => {
  const navigate = useNavigate();
  const { identifier } = useParams();
  const isEditing = Boolean(identifier);

  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedReferences, setSelectedReferences] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraft, setIsDraft] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      category: '',
      status: 'draft',
      coverImage: '',
    },
  });

  const watchTitle = watch('title');

  // API hooks
  const { data: articleData, isLoading: isLoadingArticle } = useGetArticleQuery(
    { identifier },
    { skip: !isEditing }
  );

  const { data: categoriesAndTags } = useGetCategoriesAndTagsQuery();
  const { data: articlesData } = useGetArticlesQuery({ limit: 100 });

  const [createArticle, { isLoading: isCreating }] = useCreateArticleMutation();
  const [updateArticle, { isLoading: isUpdating }] = useUpdateArticleMutation();
  const [uploadImage] = useUploadImageMutation();

  // Auto-generate slug from title
  useEffect(() => {
    if (watchTitle && !isEditing) {
      const slug = watchTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
      setValue('slug', slug);
    }
  }, [watchTitle, setValue, isEditing]);

  // Load article data for editing
  useEffect(() => {
    if (articleData?.article) {
      const article = articleData.article;
      reset({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt || '',
        category: article.category || '',
        status: article.status,
        coverImage: article.coverImage || '',
      });
      setContent(article.content);
      setIsDraft(article.status === 'draft');
      
      // Set tags
      if (article.tags) {
        setSelectedTags(article.tags.map(tag => ({ value: tag, label: tag })));
      }
      
      // Set referenced articles
      if (article.referencedArticles) {
        setSelectedReferences(
          article.referencedArticles.map(ref => ({
            value: ref._id,
            label: ref.title,
          }))
        );
      }
    }
  }, [articleData, reset]);

  // Handle image upload for editor
  const handleImageUpload = async (file) => {
    setIsUploading(true);
    try {
      const result = await uploadImage(file).unwrap();
      return result.image.url;
    } catch (error) {
      toast.error('Image upload failed');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Handle cover image upload
  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadImage(file).unwrap();
      setValue('coverImage', result.image.url);
      toast.success('Cover image uploaded successfully');
    } catch (error) {
      toast.error('Cover image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Form submission
  const onSubmit = async (data) => {
    try {
      const articleData = {
        ...data,
        content,
        tags: selectedTags.map(tag => tag.value),
        referencedArticles: selectedReferences.map(ref => ref.value),
        status: isDraft ? 'draft' : 'published',
      };

      let result;
      if (isEditing) {
        result = await updateArticle({ id: identifier, ...articleData }).unwrap();
        toast.success('Article updated successfully');
      } else {
        result = await createArticle(articleData).unwrap();
        toast.success('Article created successfully');
      }

      navigate(`/articles/${result.article.slug || result.article._id}`);
    } catch (error) {
      toast.error(error.data?.message || 'Failed to save article');
    }
  };

  // Prepare options for selects
  const tagOptions = categoriesAndTags?.tags?.map(tag => ({
    value: tag,
    label: tag,
  })) || [];

  const categoryOptions = categoriesAndTags?.categories?.map(category => ({
    value: category,
    label: category,
  })) || [];

  const articleOptions = articlesData?.articles
    ?.filter(article => article._id !== identifier)
    ?.map(article => ({
      value: article._id,
      label: article.title,
    })) || [];

  if (isLoadingArticle) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/articles')}
            className="btn-secondary btn-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Articles
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Article' : 'New Article'}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={isDraft ? 'draft' : 'published'}
              onChange={(e) => setIsDraft(e.target.value === 'draft')}
              className="input py-1 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          
          <button
            type="submit"
            form="article-form"
            disabled={isCreating || isUpdating}
            className="btn-primary"
          >
            {isCreating || isUpdating ? (
              <>
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isDraft ? 'Save Draft' : 'Publish'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form */}
      <form id="article-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">Article Details</h3>
          </div>
          <div className="card-body space-y-4">
            {/* Title */}
            <div>
              <label className="label">Title *</label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                className={`input ${errors.title ? 'input-error' : ''}`}
                placeholder="Enter article title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-danger-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="label">Slug</label>
              <input
                {...register('slug')}
                type="text"
                className="input"
                placeholder="article-slug"
              />
              <p className="mt-1 text-xs text-gray-500">
                URL-friendly version of the title. Leave blank to auto-generate.
              </p>
            </div>

            {/* Excerpt */}
            <div>
              <label className="label">Excerpt</label>
              <textarea
                {...register('excerpt')}
                rows={3}
                className="input"
                placeholder="Brief description of the article..."
              />
            </div>

            {/* Category and Tags Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="label">Category</label>
                <Select
                  options={categoryOptions}
                  value={categoryOptions.find(opt => opt.value === watch('category'))}
                  onChange={(option) => setValue('category', option?.value || '')}
                  isClearable
                  placeholder="Select or type category..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="label">Tags</label>
                <Select
                  options={tagOptions}
                  value={selectedTags}
                  onChange={setSelectedTags}
                  isMulti
                  placeholder="Select or add tags..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <label className="label">Cover Image</label>
              <div className="space-y-2">
                {watch('coverImage') && (
                  <div className="relative inline-block">
                    <img
                      src={watch('coverImage')}
                      alt="Cover"
                      className="h-32 w-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setValue('coverImage', '')}
                      className="absolute -top-2 -right-2 bg-danger-500 text-white rounded-full p-1 hover:bg-danger-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    className="hidden"
                    id="cover-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="cover-upload"
                    className={`btn-secondary cursor-pointer ${isUploading ? 'opacity-50' : ''}`}
                  >
                    {isUploading ? (
                      <>
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Cover Image
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Referenced Articles */}
            <div>
              <label className="label">Referenced Articles</label>
              <Select
                options={articleOptions}
                value={selectedReferences}
                onChange={setSelectedReferences}
                isMulti
                placeholder="Link to other articles..."
                className="react-select-container"
                classNamePrefix="react-select"
              />
              <p className="mt-1 text-xs text-gray-500">
                Articles that are referenced or related to this article.
              </p>
            </div>
          </div>
        </div>

        {/* Content Editor Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">Content</h3>
          </div>
          <div className="card-body p-0">
            <RichTextEditor
              content={content}
              onChange={setContent}
              onImageUpload={handleImageUpload}
              isUploading={isUploading}
              placeholder="Start writing your article..."
              className="border-0"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default ArticleEditor; 