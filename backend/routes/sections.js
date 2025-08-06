const express = require('express');
const { body, validationResult } = require('express-validator');
const Section = require('../models/Section');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all sections for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { archived = false } = req.query;
    
    const sections = await Section.find({ 
      user: req.user._id,
      isArchived: archived === 'true'
    }).sort({ createdAt: -1 });

    res.json({
      sections,
      count: sections.length
    });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ message: 'Server error fetching sections' });
  }
});

// Get section by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const section = await Section.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Get tasks count for this section
    const tasksCount = await Task.countDocuments({
      section: section._id,
      user: req.user._id
    });

    res.json({
      section: {
        ...section.toObject(),
        tasksCount
      }
    });
  } catch (error) {
    console.error('Get section error:', error);
    res.status(500).json({ message: 'Server error fetching section' });
  }
});

// Create new section
router.post('/', auth, [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Section name is required')
    .isLength({ max: 100 })
    .withMessage('Section name must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Please enter a valid hex color'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon must be less than 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, description, color, icon } = req.body;

    // Check if section with same name exists for this user
    const existingSection = await Section.findOne({
      name,
      user: req.user._id,
      isArchived: false
    });

    if (existingSection) {
      return res.status(400).json({ message: 'Section with this name already exists' });
    }

    const section = new Section({
      name,
      description,
      color,
      icon,
      user: req.user._id
    });

    await section.save();

    res.status(201).json({
      message: 'Section created successfully',
      section
    });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ message: 'Server error creating section' });
  }
});

// Update section
router.put('/:id', auth, [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Section name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Section name must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Please enter a valid hex color'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon must be less than 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, description, color, icon } = req.body;

    // Check if section exists and belongs to user
    const section = await Section.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Check if new name conflicts with existing sections
    if (name && name !== section.name) {
      const existingSection = await Section.findOne({
        name,
        user: req.user._id,
        _id: { $ne: req.params.id },
        isArchived: false
      });

      if (existingSection) {
        return res.status(400).json({ message: 'Section with this name already exists' });
      }
    }

    // Update fields
    if (name) section.name = name;
    if (description !== undefined) section.description = description;
    if (color) section.color = color;
    if (icon !== undefined) section.icon = icon;

    await section.save();

    res.json({
      message: 'Section updated successfully',
      section
    });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ message: 'Server error updating section' });
  }
});

// Archive/Unarchive section
router.patch('/:id/archive', auth, async (req, res) => {
  try {
    const { archive = true } = req.body;

    const section = await Section.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    section.isArchived = archive;
    await section.save();

    res.json({
      message: archive ? 'Section archived successfully' : 'Section unarchived successfully',
      section
    });
  } catch (error) {
    console.error('Archive section error:', error);
    res.status(500).json({ message: 'Server error archiving section' });
  }
});

// Delete section
router.delete('/:id', auth, async (req, res) => {
  try {
    const section = await Section.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Check if section has tasks
    const tasksCount = await Task.countDocuments({
      section: section._id,
      user: req.user._id
    });

    if (tasksCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete section with existing tasks. Please move or delete tasks first.',
        tasksCount
      });
    }

    await Section.findByIdAndDelete(req.params.id);

    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ message: 'Server error deleting section' });
  }
});

// Get section statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const section = await Section.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const stats = await Task.aggregate([
      { $match: { section: section._id, user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalTasks = await Task.countDocuments({
      section: section._id,
      user: req.user._id
    });

    const overdueTasks = await Task.countDocuments({
      section: section._id,
      user: req.user._id,
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] }
    });

    const statsObj = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      section: section.name,
      stats: {
        total: totalTasks,
        pending: statsObj.pending || 0,
        'in-progress': statsObj['in-progress'] || 0,
        completed: statsObj.completed || 0,
        cancelled: statsObj.cancelled || 0,
        overdue: overdueTasks
      }
    });
  } catch (error) {
    console.error('Get section stats error:', error);
    res.status(500).json({ message: 'Server error fetching section statistics' });
  }
});

module.exports = router; 