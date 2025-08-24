const Joi = require('joi');

// Validate project creation/update data
const validateProject = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().trim().max(100).messages({
      'string.empty': 'Project name is required',
      'string.max': 'Project name cannot be more than 100 characters'
    }),
    description: Joi.string().required().max(1000).messages({
      'string.empty': 'Project description is required',
      'string.max': 'Description cannot be more than 1000 characters'
    }),
    startDate: Joi.date().required().messages({
      'date.base': 'Start date must be a valid date',
      'any.required': 'Start date is required'
    }),
    endDate: Joi.date().required().greater(Joi.ref('startDate')).messages({
      'date.base': 'End date must be a valid date',
      'date.greater': 'End date must be after start date',
      'any.required': 'End date is required'
    }),
    budget: Joi.number().required().min(0).messages({
      'number.base': 'Budget must be a number',
      'number.min': 'Budget cannot be negative',
      'any.required': 'Budget is required'
    })
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.details[0].message
    });
  }

  next();
};

// Validate application data
const validateApplication = (req, res, next) => {
  const schema = Joi.object({
    projectId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/).messages({
      'string.empty': 'Project ID is required',
      'string.pattern.base': 'Invalid project ID format'
    })
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.details[0].message
    });
  }

  next();
};

// Validate user registration data
const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().trim().max(50).messages({
      'string.empty': 'Name is required',
      'string.max': 'Name cannot be more than 50 characters'
    }),
    email: Joi.string().required().email().messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email'
    }),
    password: Joi.string().required().min(6).messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters'
    })
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.details[0].message
    });
  }

  next();
};

// Validate user login data
const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().required().email().messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required'
    })
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.details[0].message
    });
  }

  next();
};

module.exports = {
  validateProject,
  validateApplication,
  validateRegistration,
  validateLogin
};