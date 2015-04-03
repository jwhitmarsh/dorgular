'use strict';

var express = require('express');
var controller = require('./utilities.controller');

var router = express.Router();

router.get('/directories', controller.directories);

module.exports = router;
