/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');
var async = require('async');

var hostController = require('./api/host/host.controller');
var hostFactory = require('./api/host/host.factory');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);

// Populate DB with sample data
if (config.seedDB) {
    require('./config/seed');
}

// Setup server
var app = express();
var server = require('http').createServer(app);
var socketio = require('socket.io')(server, {
    serveClient: (config.env === 'production') ? false : true,
    path: '/socket.io-client'
});
require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Start vhosts
hostController.getAll(function (err, hosts) {
    async.each(hosts, _startHost, function (err) {
        if (err) {
            console.error(err);
        }
    });
});

function _startHost(item, callback) {
    hostFactory.create(item, function (result) {
        result._id = item._id;
        hostController.vhosts.push(result);
        callback();
    });
}

// Expose app
module.exports = app;
