const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      // Zod v4 uses .issues, Zod v3 used .errors
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

module.exports = validateRequest;
