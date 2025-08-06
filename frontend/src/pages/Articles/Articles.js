import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Tag,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  useGetArticlesQuery,
  useDeleteArticleMutation,
} from '../../store/api/articlesApi';

const Articles = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Build query parameters
  const queryParams = {
    ...(searchTerm && { search: searchTerm }),
    ...(selectedStatus && { status: selectedStatus }),
    ...(selectedCategory && { category: selectedCategory }),
    ...(selectedTags.length > 0 && { tags: selectedTags }),
    sortBy,
    sortOrder,
    limit: 20,
  };

  const { data: articlesData, isLoading } = useGetArticlesQuery(queryParams);
  const [deleteArticle] = useDeleteArticleMutation();

  const articles = articlesData?.articles || [];

  const handleDeleteArticle = async (articleId) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await deleteArticle(articleId).unwrap();
        toast.success('Article deleted successfully');
      } catch (error) {
        toast.error('Failed to delete article');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      case 'published':
        return 'text-green-600 bg-green-100';
      case 'archived':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const truncateContent = (content, maxLength = 150) => {
    // Strip HTML tags and truncate
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + '...'
      : textContent;
  };

  // Get unique categories and tags from articles for filter options
  const allCategories = [...new Set(articles.map(a => a.category).filter(Boolean))];
  const allTags = [...new Set(articles.flatMap(a => a.tags || []))];

  const ArticleCard = ({ article }) => (
    <div className="bg-white rounded-lg shadow-soft border border-gray-200 overflow-hidden hover:shadow-medium transition-shadow">
      {/* Cover Image */}
      {article.coverImage && (
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <Link
              to={`/articles/${article.slug || article._id}`}
              className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-2"
            >
              {article.title}
            </Link>
            {article.excerpt && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {article.excerpt}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="relative group ml-4">
            <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
              <MoreVertical className="h-4 w-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <Link
                to={`/articles/${article.slug || article._id}`}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Article
              </Link>
              <Link
                to={`/articles/${article.slug || article._id}/edit`}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Article
              </Link>
              <button
                onClick={() => handleDeleteArticle(article._id)}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Article
              </button>
            </div>
          </div>
        </div>

        {/* Content Preview */}
        {article.content && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {truncateContent(article.content)}
          </p>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {article.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
              >
                <Tag className="h-2 w-2 mr-1" />
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{article.tags.length - 3} more</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            {/* Status */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(article.status)}`}>
              {article.status}
            </span>

            {/* Category */}
            {article.category && (
              <span className="flex items-center">
                <FileText className="h-3 w-3 mr-1" />
                {article.category}
              </span>
            )}

            {/* Date */}
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {article.publishedAt 
                ? format(new Date(article.publishedAt), 'MMM d, yyyy')
                : format(new Date(article.createdAt), 'MMM d, yyyy')
              }
            </span>
          </div>

          {/* Metadata */}
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            {/* Read Time */}
            {article.readTime && (
              <span>{article.readTime} min read</span>
            )}

            {/* Views */}
            {article.views > 0 && (
              <span className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                {article.views}
              </span>
            )}

            {/* References */}
            {article.referencedArticles && article.referencedArticles.length > 0 && (
              <span className="flex items-center">
                <ExternalLink className="h-3 w-3 mr-1" />
                {article.referencedArticles.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
          <p className="text-gray-600">
            {articles.length} article{articles.length !== 1 ? 's' : ''}
            {articlesData?.pagination?.totalCount && articlesData.pagination.totalCount !== articles.length &&
              ` of ${articlesData.pagination.totalCount}`
            }
          </p>
        </div>
        <button
          onClick={() => navigate('/articles/new')}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Article
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-4">
        <div className="flex items-center space-x-4 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'bg-primary-50 text-primary-700' : ''}`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="input py-2"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="publishedAt-desc">Recently Published</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="views-desc">Most Viewed</option>
          </select>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="label">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="label">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input"
              >
                <option value="">All Categories</option>
                {allCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Tags</label>
              <select
                multiple
                value={selectedTags}
                onChange={(e) => setSelectedTags(Array.from(e.target.selectedOptions, option => option.value))}
                className="input"
                size={3}
              >
                {allTags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
          </div>
        )}
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-12">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || selectedStatus || selectedCategory || selectedTags.length > 0
                ? 'No articles match your filters'
                : 'No articles yet'
              }
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedStatus || selectedCategory || selectedTags.length > 0
                ? 'Try adjusting your search or filters.'
                : 'Get started by writing your first article.'
              }
            </p>
            {!searchTerm && !selectedStatus && !selectedCategory && selectedTags.length === 0 && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/articles/new')}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Write Article
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Articles; 