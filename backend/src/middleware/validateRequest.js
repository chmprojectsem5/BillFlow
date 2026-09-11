const AppError = require('../utils/AppError');

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      // Format Zod errors
      const errors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      res.status(400).json({
        success: false,
        status: 'fail',
        message: 'Validation failed',
        errors
      });
    }
  };
};

module.exports = validateRequest;
