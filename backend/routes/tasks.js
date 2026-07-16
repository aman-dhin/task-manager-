const express = require('express');
const mongoose = require('mongoose');
const { body, query, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All task routes require a valid JWT
router.use(authenticate);

const PRIORITIES = ['High', 'Medium', 'Low'];
const STATUSES = ['Pending', 'Completed'];

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ---------------------------------------------------------------
// GET /tasks
// Supports: ?status=Pending|Completed  ?priority=High|Medium|Low
//           ?search=text  ?page=1&limit=10  ?sort=dueDate|priority|createdAt|title
// ---------------------------------------------------------------
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { status, priority, search, sort } = req.query;
      const page = req.query.page || 1;
      const limit = req.query.limit || 10;
      const skip = (page - 1) * limit;

      const filter = { user: req.user.id };
      if (status && STATUSES.includes(status)) filter.status = status;
      if (priority && PRIORITIES.includes(priority)) filter.priority = priority;
      if (search) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ title: regex }, { description: regex }];
      }

      const sortField = ['dueDate', 'priority', 'createdAt', 'title'].includes(sort)
        ? sort
        : 'createdAt';

      const [tasks, total, summaryAgg] = await Promise.all([
        Task.find(filter).sort({ [sortField]: -1 }).skip(skip).limit(limit),
        Task.countDocuments(filter),
        Task.aggregate([
          { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
              completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            },
          },
        ]),
      ]);

      const summary = summaryAgg[0]
        ? { total: summaryAgg[0].total, pending: summaryAgg[0].pending, completed: summaryAgg[0].completed }
        : { total: 0, pending: 0, completed: 0 };

      return res.json({
        tasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
        summary,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------------
// POST /tasks
// ---------------------------------------------------------------
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('dueDate').optional({ checkFalsy: true }).isISO8601().withMessage('Due date must be a valid date (YYYY-MM-DD)'),
    body('priority').optional().isIn(PRIORITIES).withMessage('Priority must be High, Medium, or Low'),
    body('status').optional().isIn(STATUSES).withMessage('Status must be Pending or Completed'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { title, description = '', dueDate = null, priority = 'Medium', status = 'Pending' } = req.body;

      const task = await Task.create({
        user: req.user.id,
        title,
        description,
        dueDate,
        priority,
        status,
      });

      return res.status(201).json({ message: 'Task created', task });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------------
// PUT /tasks/:id
// ---------------------------------------------------------------
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('dueDate').optional({ checkFalsy: true }).isISO8601().withMessage('Due date must be a valid date (YYYY-MM-DD)'),
    body('priority').optional().isIn(PRIORITIES).withMessage('Priority must be High, Medium, or Low'),
    body('status').optional().isIn(STATUSES).withMessage('Status must be Pending or Completed'),
  ],
  async (req, res, next) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const fields = ['title', 'description', 'dueDate', 'priority', 'status'];
      fields.forEach((field) => {
        if (req.body[field] !== undefined) task[field] = req.body[field];
      });

      await task.save();

      return res.json({ message: 'Task updated', task });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------------
// DELETE /tasks/:id
// ---------------------------------------------------------------
router.delete('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
