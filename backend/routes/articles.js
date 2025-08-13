const express = require('express');
const { body, validationResult } = require('express-validator');
const Article = require('../models/Article');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all articles for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const {
      status,
      category,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      tags
    } = req.query;

    // Build query
    const query = { user: req.user._id };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const articles = await Article.find(query)
      .populate('referencedArticles', 'title slug status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-content'); // Exclude content for list view

    const total = await Article.countDocuments(query);

    res.json({
      articles,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: articles.length,
        totalCount: total
      }
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ message: 'Server error fetching articles' });
  }
});

// Get article by ID or slug
router.get('/:identifier', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    const { increment_views = false } = req.query;

    // Try to find by ID first, then by slug
    let query = { user: req.user._id };
    
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = identifier;
    } else {
      query.slug = identifier;
    }

    const article = await Article.findOne(query)
      .populate('referencedArticles', 'title slug status excerpt');

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Increment views if requested
    if (increment_views === 'true') {
      article.views += 1;
      await article.save();
    }

    res.json({ article });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ message: 'Server error fetching article' });
  }
});

// Create new article
router.post('/', auth, [
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must be less than 200 characters'),
  body('title')
    .if(body('status').equals('published'))
    .notEmpty()
    .withMessage('Article title is required'),
  body('content')
    .optional({ checkFalsy: true }),
  body('content')
    .if(body('status').equals('published'))
    .notEmpty()
    .withMessage('Article content is required'),
  body('slug')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('excerpt')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt must be less than 500 characters'),
  body('category')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('referencedArticles')
    .optional()
    .isArray()
    .withMessage('Referenced articles must be an array'),
  body('referencedArticles.*')
    .optional()
    .isMongoId()
    .withMessage('Each referenced article must be a valid ID'),
  body('coverImage')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Cover image must be a valid URL')
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
      title,
      content,
      slug,
      excerpt,
      category,
      status,
      tags,
      referencedArticles,
      coverImage,
      images
    } = req.body;

    // Check if slug already exists for this user
    if (slug) {
      const existingArticle = await Article.findOne({
        slug,
        user: req.user._id
      });

      if (existingArticle) {
        return res.status(400).json({ message: 'Article with this slug already exists' });
      }
    }

    // Verify referenced articles belong to user
    if (referencedArticles && referencedArticles.length > 0) {
      const articleCount = await Article.countDocuments({
        _id: { $in: referencedArticles },
        user: req.user._id
      });

      if (articleCount !== referencedArticles.length) {
        return res.status(400).json({ message: 'One or more referenced articles not found' });
      }
    }

    const article = new Article({
      title,
      content,
      slug,
      excerpt,
      category,
      status,
      tags,
      referencedArticles,
      coverImage,
      images,
      user: req.user._id
    });

    await article.save();

    // Populate the article before returning
    await article.populate('referencedArticles', 'title slug status');

    res.status(201).json({
      message: 'Article created successfully',
      article
    });
  } catch (error) {
    console.error('Create article error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Article with this slug already exists' });
    }
    res.status(500).json({ message: 'Server error creating article' });
  }
});

// Update article
router.put('/:id', auth, [
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must be less than 200 characters'),
  body('title')
    .if(body('status').equals('published'))
    .notEmpty()
    .withMessage('Article title cannot be empty'),
  body('content')
    .optional({ checkFalsy: true }),
  body('content')
    .if(body('status').equals('published'))
    .notEmpty()
    .withMessage('Article content cannot be empty'),
  body('slug')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('excerpt')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt must be less than 500 characters'),
  body('category')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('referencedArticles')
    .optional()
    .isArray()
    .withMessage('Referenced articles must be an array'),
  body('referencedArticles.*')
    .optional()
    .isMongoId()
    .withMessage('Each referenced article must be a valid ID'),
  body('coverImage')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Cover image must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const article = await Article.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const {
      title,
      content,
      slug,
      excerpt,
      category,
      status,
      tags,
      referencedArticles,
      coverImage,
      images
    } = req.body;

    // Check if new slug conflicts with existing articles
    if (slug && slug !== article.slug) {
      const existingArticle = await Article.findOne({
        slug,
        user: req.user._id,
        _id: { $ne: req.params.id }
      });

      if (existingArticle) {
        return res.status(400).json({ message: 'Article with this slug already exists' });
      }
    }

    // Verify referenced articles belong to user if provided
    if (referencedArticles && referencedArticles.length > 0) {
      const articleCount = await Article.countDocuments({
        _id: { $in: referencedArticles },
        user: req.user._id
      });

      if (articleCount !== referencedArticles.length) {
        return res.status(400).json({ message: 'One or more referenced articles not found' });
      }
    }

    // Update fields
    if (title !== undefined) article.title = title;
    if (content !== undefined) article.content = content;
    if (slug !== undefined) article.slug = slug;
    if (excerpt !== undefined) article.excerpt = excerpt;
    if (category !== undefined) article.category = category;
    if (status !== undefined) article.status = status;
    if (tags !== undefined) article.tags = tags;
    if (referencedArticles !== undefined) article.referencedArticles = referencedArticles;
    if (coverImage !== undefined) article.coverImage = coverImage;
    if (images !== undefined) article.images = images;

    await article.save();

    // Populate the article before returning
    await article.populate('referencedArticles', 'title slug status');

    res.json({
      message: 'Article updated successfully',
      article
    });
  } catch (error) {
    console.error('Update article error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Article with this slug already exists' });
    }
    res.status(500).json({ message: 'Server error updating article' });
  }
});

// Delete article
router.delete('/:id', auth, async (req, res) => {
  try {
    const article = await Article.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Remove references to this article from other articles
    await Article.updateMany(
      { 
        user: req.user._id,
        referencedArticles: article._id 
      },
      { 
        $pull: { referencedArticles: article._id } 
      }
    );

    await Article.findByIdAndDelete(req.params.id);

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ message: 'Server error deleting article' });
  }
});

// Get article statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Article.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Article.aggregate([
      { $match: { user: req.user._id, category: { $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const totalArticles = await Article.countDocuments({ user: req.user._id });
    const totalViews = await Article.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    const publishedThisMonth = await Article.countDocuments({
      user: req.user._id,
      status: 'published',
      publishedAt: { 
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
      }
    });

    const statsObj = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      total: totalArticles,
      status: {
        draft: statsObj.draft || 0,
        published: statsObj.published || 0,
        archived: statsObj.archived || 0
      },
      categories: categoryStats,
      totalViews: totalViews[0]?.totalViews || 0,
      publishedThisMonth
    });
  } catch (error) {
    console.error('Get article stats error:', error);
    res.status(500).json({ message: 'Server error fetching article statistics' });
  }
});

// Search articles by content
router.post('/search', auth, [
  body('query')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters long'),
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { query: searchQuery, filters = {} } = req.body;
    const { status, category, tags, limit = 10 } = filters;

    const matchQuery = {
      user: req.user._id,
      $text: { $search: searchQuery }
    };

    if (status) matchQuery.status = status;
    if (category) matchQuery.category = category;
    if (tags && tags.length > 0) matchQuery.tags = { $in: tags };

    const articles = await Article.find(matchQuery, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit))
      .select('title slug excerpt status category tags publishedAt score');

    res.json({
      query: searchQuery,
      results: articles,
      count: articles.length
    });
  } catch (error) {
    console.error('Search articles error:', error);
    res.status(500).json({ message: 'Server error searching articles' });
  }
});

// Get categories and tags
router.get('/meta/categories-tags', auth, async (req, res) => {
  try {
    const categories = await Article.distinct('category', { 
      user: req.user._id, 
      category: { $ne: null, $ne: '' } 
    });

    const tags = await Article.distinct('tags', { 
      user: req.user._id 
    });

    res.json({
      categories: categories.sort(),
      tags: tags.sort()
    });
  } catch (error) {
    console.error('Get categories and tags error:', error);
    res.status(500).json({ message: 'Server error fetching categories and tags' });
  }
});

module.exports = router; 