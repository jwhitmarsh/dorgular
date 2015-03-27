/**
 * Created by jwhitmarsh on 14/01/2015.
 */

'use strict';

var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var enableDestroy = require('server-destroy');

exports.create = function (host, cb) {
    var app = express();
    var oneDay = 86400000; // one day of caching

// gzip stuff
    app.use(compression());

// parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({
        extended: false
    }));

// parse application/json
    app.use(bodyParser.json());

// caching
    app.use('/', express.static(host.directory, {
        maxAge: oneDay
    }));

// some error handling
    app.use(function (err, req, res, next) {
        console.error(err.stack);
        res.status(500).send('Something broke!');
    });

    var server = app.listen(host.port, function () {
        var address = server.address().address;
        var port = server.address().port;

        // this is so we can do a force close later
        enableDestroy(server);

        console.log('%s serving at http://%s:%s', host.name, address, port);

        //fire callback when it's all running
        var result = {
            app: app,
            server: server
        };
        cb(result);
    });
};
