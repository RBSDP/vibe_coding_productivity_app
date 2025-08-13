import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Loader, Edit, Calendar, Tag, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useGetArticleQuery } from '../../store/api/articlesApi';

const ArticleDetail = () => {
  const navigate = useNavigate();
  const { identifier } = useParams();
  const { data, isLoading, isError, error } = useGetArticleQuery({ identifier, increment_views: true });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="card-body">
            <p className="text-danger-600 font-medium mb-2">Failed to load article</p>
            <p className="text-sm text-gray-600">{error?.data?.message || 'Something went wrong.'}</p>
            <button onClick={() => navigate('/articles')} className="btn-secondary mt-4">Back to Articles</button>
          </div>
        </div>
      </div>
    );
  }

  const article = data?.article;
  if (!article) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="card-body">
            <p className="text-gray-700">Article not found.</p>
            <button onClick={() => navigate('/articles')} className="btn-secondary mt-4">Back to Articles</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/articles')} className="btn-secondary btn-sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Articles
        </button>
        <Link to={`/articles/${article.slug || article._id}/edit`} className="btn-primary btn-sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Link>
      </div>

      <div className="card overflow-hidden">
        {article.coverImage && (
          <img src={article.coverImage} alt={article.title} className="w-full h-64 object-cover" />
        )}
        <div className="card-body">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{article.title || 'Untitled Draft'}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700">
              {article.status}
            </span>
            {article.category && (
              <span>{article.category}</span>
            )}
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {article.publishedAt
                ? format(new Date(article.publishedAt), 'MMM d, yyyy')
                : format(new Date(article.createdAt), 'MMM d, yyyy')}
            </span>
            {article.readTime && (
              <span>{article.readTime} min read</span>
            )}
            {typeof article.views === 'number' && (
              <span>{article.views} views</span>
            )}
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {article.excerpt && (
            <p className="text-gray-700 mb-6">{article.excerpt}</p>
          )}

          {article.content && (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
          )}

          {article.referencedArticles && article.referencedArticles.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">References</h2>
              <ul className="list-disc pl-5 space-y-1">
                {article.referencedArticles.map((ref) => (
                  <li key={ref._id}>
                    <Link to={`/articles/${ref.slug || ref._id}`} className="text-primary-600 hover:underline">
                      {ref.title}
                    </Link>
                    <span className="ml-2 text-xs text-gray-500">({ref.status})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail; 