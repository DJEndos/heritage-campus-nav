const express = require('express');
const { navigate } = require('../controllers/navigationController');

const router = express.Router();

router.get('/', navigate);

module.exports = router;
