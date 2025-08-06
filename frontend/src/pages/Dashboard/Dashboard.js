import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckSquare, 
  FileText, 
  Clock, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  Target,
  BookOpen,
  Eye,
  Plus,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { format, isToday, isThisWeek, startOfWeek, endOfWeek } from 'date-fns';
import { useGetTaskStatsQuery, useGetTasksQuery } from '../../store/api/tasksApi';
import { useGetArticleStatsQuery, useGetArticlesQuery } from '../../store/api/articlesApi';
import { useGetSectionsQuery } from '../../store/api/sectionsApi';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useSelector } from 'react-redux';

const Dashboard = () => {
  const user = useSelector(selectCurrentUser);

  // API queries
  const { data: taskStats, isLoading: isLoadingTaskStats } = useGetTaskStatsQuery();
  const { data: articleStats, isLoading: isLoadingArticleStats } = useGetArticleStatsQuery();
  const { data: sectionsData } = useGetSectionsQuery();
  
  // Get recent and upcoming tasks
  const { data: recentTasksData } = useGetTasksQuery({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 5,
  });
  
  const { data: upcomingTasksData } = useGetTasksQuery({
    sortBy: 'dueDate',
    sortOrder: 'asc',
    limit: 5,
    status: 'pending,in-progress',
  });

  const { data: overdueTasksData } = useGetTasksQuery({
    overdue: true,
    limit: 10,
  });

  // Get recent articles
  const { data: recentArticlesData } = useGetArticlesQuery({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 5,
  });

  const recentTasks = recentTasksData?.tasks || [];
  const upcomingTasks = upcomingTasksData?.tasks || [];
  const overdueTasks = overdueTasksData?.tasks || [];
  const recentArticles = recentArticlesData?.articles || [];
  const sections = sectionsData?.sections || [];

  // Calculate additional metrics
  const completionRate = taskStats ? 
    Math.round((taskStats.status.completed / taskStats.total) * 100) || 0 : 0;
  
  const todayTasks = recentTasks.filter(task => isToday(new Date(task.createdAt)));
  const thisWeekTasks = recentTasks.filter(task => isThisWeek(new Date(task.createdAt)));

  const StatCard = ({ title, value, change, changeType, icon: Icon, color, href }) => (
    <div className="bg-white overflow-hidden shadow-soft rounded-lg border border-gray-200">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {change !== undefined && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    changeType === 'increase' ? 'text-green-600' : 
                    changeType === 'decrease' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {changeType === 'increase' && <ArrowUp className="h-3 w-3 mr-0.5" />}
                    {changeType === 'decrease' && <ArrowDown className="h-3 w-3 mr-0.5" />}
                    {Math.abs(change)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {href && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link to={href} className="font-medium text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  const ProgressBar = ({ label, value, max, color = 'bg-primary-600' }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
          <span>{label}</span>
          <span>{value}/{max}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  const TaskItem = ({ task, showSection = true }) => (
    <div className="flex items-center space-x-3 py-2">
      <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
        task.priority === 'urgent' ? 'bg-red-500' :
        task.priority === 'high' ? 'bg-orange-500' :
        task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'
      }`} />
      <div className="flex-1 min-w-0">
        <Link 
          to={`/tasks/${task._id}`}
          className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block"
        >
          {task.name}
        </Link>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          {showSection && task.section && (
            <span className="flex items-center">
              <div 
                className="w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: task.section.color }}
              />
              {task.section.name}
            </span>
          )}
          <span className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        </div>
      </div>
    </div>
  );

  const ArticleItem = ({ article }) => (
    <div className="flex items-center space-x-3 py-2">
      <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
        article.status === 'published' ? 'bg-green-500' :
        article.status === 'draft' ? 'bg-yellow-500' : 'bg-gray-400'
      }`} />
      <div className="flex-1 min-w-0">
        <Link 
          to={`/articles/${article.slug || article._id}`}
          className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block"
        >
          {article.title}
        </Link>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span className="capitalize">{article.status}</span>
          {article.category && (
            <>
              <span>•</span>
              <span>{article.category}</span>
            </>
          )}
          <span>•</span>
          <span>{format(new Date(article.createdAt), 'MMM d')}</span>
        </div>
      </div>
      {article.views > 0 && (
        <div className="flex items-center text-xs text-gray-500">
          <Eye className="h-3 w-3 mr-1" />
          {article.views}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow-soft rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.username}!
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Here's what's happening with your productivity today.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <div className="flex space-x-3">
                <Link to="/tasks" className="btn-primary btn-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Link>
                <Link to="/articles/new" className="btn-secondary btn-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Write Article
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tasks"
          value={taskStats?.total || 0}
          icon={CheckSquare}
          color="text-blue-600"
          href="/tasks"
        />
        <StatCard
          title="Completed Tasks"
          value={taskStats?.status?.completed || 0}
          change={completionRate}
          changeType="increase"
          icon={Target}
          color="text-green-600"
          href="/tasks?status=completed"
        />
        <StatCard
          title="Articles"
          value={articleStats?.total || 0}
          icon={FileText}
          color="text-purple-600"
          href="/articles"
        />
        <StatCard
          title="Overdue Tasks"
          value={taskStats?.overdue || 0}
          icon={AlertTriangle}
          color="text-red-600"
          href="/tasks?overdue=true"
        />
      </div>

      {/* Charts and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Progress */}
        <div className="bg-white shadow-soft rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Task Progress
          </h3>
          
          {/* Completion Rate */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Completion</span>
              <span className="text-sm font-semibold text-green-600">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Status Breakdown */}
          {taskStats && (
            <div className="space-y-3">
              <ProgressBar 
                label="Pending" 
                value={taskStats.status.pending} 
                max={taskStats.total}
                color="bg-gray-500"
              />
              <ProgressBar 
                label="In Progress" 
                value={taskStats.status['in-progress']} 
                max={taskStats.total}
                color="bg-blue-500"
              />
              <ProgressBar 
                label="Completed" 
                value={taskStats.status.completed} 
                max={taskStats.total}
                color="bg-green-500"
              />
            </div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className="bg-white shadow-soft rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Task Priority
          </h3>
          
          {taskStats && (
            <div className="space-y-3">
              <ProgressBar 
                label="Urgent" 
                value={taskStats.priority.urgent} 
                max={taskStats.total}
                color="bg-red-500"
              />
              <ProgressBar 
                label="High" 
                value={taskStats.priority.high} 
                max={taskStats.total}
                color="bg-orange-500"
              />
              <ProgressBar 
                label="Medium" 
                value={taskStats.priority.medium} 
                max={taskStats.total}
                color="bg-blue-500"
              />
              <ProgressBar 
                label="Low" 
                value={taskStats.priority.low} 
                max={taskStats.total}
                color="bg-gray-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white shadow-soft rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Tasks
              </h3>
              <Link 
                to="/tasks" 
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </div>
            
            <div className="space-y-1">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <TaskItem key={task._id} task={task} />
                ))
              ) : (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No recent tasks
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white shadow-soft rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Upcoming Tasks
              </h3>
              <Link 
                to="/tasks?sortBy=dueDate&sortOrder=asc" 
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </div>
            
            <div className="space-y-1">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <TaskItem key={task._id} task={task} />
                ))
              ) : (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No upcoming tasks
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Articles */}
        <div className="bg-white shadow-soft rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Articles
              </h3>
              <Link 
                to="/articles" 
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </div>
            
            <div className="space-y-1">
              {recentArticles.length > 0 ? (
                recentArticles.map((article) => (
                  <ArticleItem key={article._id} article={article} />
                ))
              ) : (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No recent articles
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Tasks Alert */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                You have {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}
              </h3>
              <div className="mt-2">
                <div className="space-y-1">
                  {overdueTasks.slice(0, 3).map((task) => (
                    <div key={task._id} className="text-sm text-red-700">
                      <Link 
                        to={`/tasks/${task._id}`}
                        className="font-medium hover:text-red-900"
                      >
                        {task.name}
                      </Link>
                      <span className="ml-2">
                        (Due {format(new Date(task.dueDate), 'MMM d')})
                      </span>
                    </div>
                  ))}
                  {overdueTasks.length > 3 && (
                    <div className="text-sm text-red-700">
                      And {overdueTasks.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <div className="flex space-x-2">
                  <Link
                    to="/tasks?overdue=true"
                    className="bg-red-100 px-3 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    View all overdue
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-900">
              {taskStats?.completedThisWeek || 0}
            </div>
            <div className="text-sm text-primary-600">Completed This Week</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-900">
              {articleStats?.publishedThisMonth || 0}
            </div>
            <div className="text-sm text-primary-600">Published This Month</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-900">
              {sections.length}
            </div>
            <div className="text-sm text-primary-600">Active Sections</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-900">
              {articleStats?.totalViews || 0}
            </div>
            <div className="text-sm text-primary-600">Total Article Views</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 