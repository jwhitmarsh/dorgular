'use strict';

var express = require('express');
var controller = require('./host.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/host/:id', controller.show);
router.get('/sync/:id', controller.sync);
router.get('/sync/', controller.syncAll);
router.get('/reservedPorts', controller.getReservedPorts);
router.get('/suggestPort', controller.suggestPort);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
