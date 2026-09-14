const express = require('express');
const authController = require('../../controllers/auth.controller');
const validateRequest = require('../../middleware/validateRequest');
const { registerSchema, loginSchema } = require('../../validators/auth.validator');
const { protect } = require('../../middleware/auth');

const router = express.Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
