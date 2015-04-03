'use strict';

var express = require('express');
var controller = require('./utilities.controller');

var router = express.Router();

router.post('/directories', controller.directories);

module.exports = router;
