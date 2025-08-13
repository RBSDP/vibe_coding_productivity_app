const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Section = require('../models/Section');
const Article = require('../models/Article');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all tasks for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const {
      section,
      status,
      priority,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      dueDate,
      overdue
    } = req.query;

    // Build query
    const query = { user: req.user._id };
    
    if (section) query.section = section;
    if (status) {
      // Handle multiple status values separated by comma
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }
    if (priority) {
      // Handle multiple priority values separated by comma
      if (priority.includes(',')) {
        query.priority = { $in: priority.split(',') };
      } else {
        query.priority = priority;
      }
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (dueDate) {
      const date = new Date(dueDate);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      query.dueDate = { $gte: date, $lt: nextDay };
    }
    
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $nin: ['completed', 'cancelled'] };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const tasks = await Task.find(query)
      .populate('section', 'name color icon')
      .populate('linkedArticles', 'title slug status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: tasks.length,
        totalCount: total
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
});

// Get task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('section', 'name color icon')
      .populate('linkedArticles', 'title slug status excerpt');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error fetching task' });
  }
});

// Create new task
router.post('/', auth, [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Task name is required')
    .isLength({ max: 200 })
    .withMessage('Task name must be less than 200 characters'),
  body('dueDate')
    .isISO8601()
    .withMessage('Please enter a valid due date'),
  body('section')
    .isMongoId()
    .withMessage('Please provide a valid section ID'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must be less than 2000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Status must be pending, in-progress, completed, or cancelled'),
  body('linkedArticles')
    .optional()
    .isArray()
    .withMessage('Linked articles must be an array'),
  body('linkedArticles.*')
    .optional()
    .isMongoId()
    .withMessage('Each linked article must be a valid ID'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('estimatedTime')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Estimated time must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      name,
      description,
      dueDate,
      notes,
      priority,
      status,
      section,
      linkedArticles,
      tags,
      estimatedTime
    } = req.body;

    // Verify section belongs to user
    const sectionDoc = await Section.findOne({
      _id: section,
      user: req.user._id,
      isArchived: false
    });

    if (!sectionDoc) {
      return res.status(400).json({ message: 'Section not found or archived' });
    }

    // Verify linked articles belong to user
    if (linkedArticles && linkedArticles.length > 0) {
      const articleCount = await Article.countDocuments({
        _id: { $in: linkedArticles },
        user: req.user._id
      });

      if (articleCount !== linkedArticles.length) {
        return res.status(400).json({ message: 'One or more linked articles not found' });
      }
    }

    const task = new Task({
      name,
      description,
      dueDate,
      notes,
      priority,
      status,
      section,
      linkedArticles,
      tags,
      estimatedTime,
      user: req.user._id
    });

    await task.save();

    // Populate the task before returning
    await task.populate('section', 'name color icon');
    await task.populate('linkedArticles', 'title slug status');

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
});

// Update task
router.put('/:id', auth, [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task name cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Task name must be less than 200 characters'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Please enter a valid due date'),
  body('section')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid section ID'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must be less than 2000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Status must be pending, in-progress, completed, or cancelled'),
  body('linkedArticles')
    .optional()
    .isArray()
    .withMessage('Linked articles must be an array'),
  body('linkedArticles.*')
    .optional()
    .isMongoId()
    .withMessage('Each linked article must be a valid ID'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('estimatedTime')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Estimated time must be a positive integer'),
  body('actualTime')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Actual time must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const {
      name,
      description,
      dueDate,
      notes,
      priority,
      status,
      section,
      linkedArticles,
      tags,
      estimatedTime,
      actualTime
    } = req.body;

    // Verify section belongs to user if provided
    if (section) {
      const sectionDoc = await Section.findOne({
        _id: section,
        user: req.user._id,
        isArchived: false
      });

      if (!sectionDoc) {
        return res.status(400).json({ message: 'Section not found or archived' });
      }
    }

    // Verify linked articles belong to user if provided
    if (linkedArticles && linkedArticles.length > 0) {
      const articleCount = await Article.countDocuments({
        _id: { $in: linkedArticles },
        user: req.user._id
      });

      if (articleCount !== linkedArticles.length) {
        return res.status(400).json({ message: 'One or more linked articles not found' });
      }
    }

    // Update fields
    if (name !== undefined) task.name = name;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (notes !== undefined) task.notes = notes;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (section !== undefined) task.section = section;
    if (linkedArticles !== undefined) task.linkedArticles = linkedArticles;
    if (tags !== undefined) task.tags = tags;
    if (estimatedTime !== undefined) task.estimatedTime = estimatedTime;
    if (actualTime !== undefined) task.actualTime = actualTime;

    await task.save();

    // Populate the task before returning
    await task.populate('section', 'name color icon');
    await task.populate('linkedArticles', 'title slug status');

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error updating task' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error deleting task' });
  }
});

// Get task statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { section } = req.query;
    
    const matchQuery = { user: req.user._id };
    if (section) matchQuery.section = section;

    const stats = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalTasks = await Task.countDocuments(matchQuery);

    const overdueTasks = await Task.countDocuments({
      ...matchQuery,
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] }
    });

    const completedThisWeek = await Task.countDocuments({
      ...matchQuery,
      status: 'completed',
      completedAt: { 
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
      }
    });

    const statsObj = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const priorityStatsObj = priorityStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      total: totalTasks,
      status: {
        pending: statsObj.pending || 0,
        'in-progress': statsObj['in-progress'] || 0,
        completed: statsObj.completed || 0,
        cancelled: statsObj.cancelled || 0
      },
      priority: {
        low: priorityStatsObj.low || 0,
        medium: priorityStatsObj.medium || 0,
        high: priorityStatsObj.high || 0,
        urgent: priorityStatsObj.urgent || 0
      },
      overdue: overdueTasks,
      completedThisWeek
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ message: 'Server error fetching task statistics' });
  }
});

// Bulk update tasks
router.patch('/bulk', auth, [
  body('taskIds')
    .isArray({ min: 1 })
    .withMessage('Task IDs array is required'),
  body('taskIds.*')
    .isMongoId()
    .withMessage('Each task ID must be valid'),
  body('updates')
    .isObject()
    .withMessage('Updates object is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { taskIds, updates } = req.body;

    // Verify all tasks belong to user
    const taskCount = await Task.countDocuments({
      _id: { $in: taskIds },
      user: req.user._id
    });

    if (taskCount !== taskIds.length) {
      return res.status(400).json({ message: 'One or more tasks not found' });
    }

    const result = await Task.updateMany(
      { 
        _id: { $in: taskIds },
        user: req.user._id
      },
      updates
    );

    res.json({
      message: 'Tasks updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update tasks error:', error);
    res.status(500).json({ message: 'Server error updating tasks' });
  }
});

module.exports = router; 