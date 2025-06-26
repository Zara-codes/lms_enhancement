const express = require('express');
const { initiatePayment, verifyPayment } = require('../controllers/esewaController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/esewa/initiate', protect, initiatePayment);
router.post('/esewa/verify', protect, verifyPayment);

module.exports = router;