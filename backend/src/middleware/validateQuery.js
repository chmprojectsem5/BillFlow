const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      const issues = error.issues || error.errors || [];
      const errors = issues.map(err => ({
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

module.exports = validateQuery;
