'use strict';

var exec = require('child_process').exec;
var async = require('async');
var pathEndsWith = require('path-ends-with');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');

var serverFactory = require('./host.factory');
var Host = require('./host.model');

// Get list of hosts
exports.index = function (req, res) {
    Host.find(function (err, hosts) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(200, hosts);
    });
};

// Get a single host
exports.show = function (req, res) {
    Host.findById(req.params.id, function (err, host) {
        if (err) {
            return handleError(res, err);
        }
        if (!host) {
            return res.send(404);
        }
        return res.json(host);
    });
};

// Creates a new host in the DB.
exports.create = function (req, res) {
    console.log('creating...', req.body);

    var result = {
        status: true,
        msg: 'achievment unlocked: added vhost'
    };

    var host = req.body;

    var newHost = new Host({
        name: host.name,
        port: host.port,
        directory: host.directory,
        href: 'http://localhost:' + host.port
    });

    var vhosts = [];

    async.series([
        function (cb) {
            console.log('getting hosts...');
            Host.find(function (err, hosts) {
                vhosts = hosts;
                cb(err);
            });
        }, function (cb) {
            console.log('validating host...');
            _validateHost(newHost, vhosts, function (results) {
                if (!results.status) {
                    return cb(results.msg);
                }
                cb(null);
            });
        },
        function (cb) {
            console.log('getting additional info...');
            _getAdditionalInfo(newHost, cb);
        },
        function (cb) {
            console.log('getting git tag...');
            _gitTag(host.directory, function (tag) {
                newHost.tag = tag;
                cb(null);
            });
        },
        function (cb) {
            console.log('getting git url...');
            _gitURL(host.directory, function (giturl) {
                //tidy the giturl
                if (giturl.indexOf('git@') >= 0) {
                    giturl = giturl.replace('git@', '');
                    giturl = giturl.replace(':', '/');
                    giturl = giturl.replace('.git', '');
                    giturl = 'https://' + giturl;
                }
                newHost.giturl = giturl;
                cb(null);
            });
        },
        function (cb) {
            console.log('saving to db...');
            newHost.save(function (err, savedHost) {
                //bounce it
                if (err) {
                    console.log(err);
                    result.status = false;
                    result.msg = err;
                    return cb(result);
                }
                newHost._id = savedHost._id;
                result.data = newHost;
                cb(null);
            });
        },
        function (cb) {
            console.log('starting server...');
            serverFactory.create(host, function (result) {
                result._id = newHost._id;
                vhosts.push(result);
                cb(null);
            });
        }
    ], function (err) {
        if (err) {
            console.log(err);
            result.status = false;
            result.msg = err;
        }
        return res.json(201, result);
    });
    //Host.create(req.body, function (err, host) {
    //    if (err) {
    //        return handleError(res, err);
    //    }
    //    return res.json(201, host);
    //});
};

// Updates an existing host in the DB.
exports.update = function (req, res) {
    if (req.body._id) {
        delete req.body._id;
    }
    Host.findById(req.params.id, function (err, host) {
        if (err) {
            return handleError(res, err);
        }
        if (!host) {
            return res.send(404);
        }
        var updated = _.merge(host, req.body);
        updated.save(function (err) {
            if (err) {
                return handleError(res, err);
            }
            return res.json(200, host);
        });
    });
};

// Deletes a host from the DB.
exports.destroy = function (req, res) {
    Host.findById(req.params.id, function (err, host) {
        if (err) {
            return handleError(res, err);
        }
        if (!host) {
            return res.send(404);
        }
        host.remove(function (err) {
            if (err) {
                return handleError(res, err);
            }
            return res.send(204);
        });
    });
};

function handleError(res, err) {
    return res.send(500, err);
}

var reservedPorts = [
    "0", "0000", "0001", "1", "2", "3", "4", "5", "6", "7", "11",
    "20", "21", "22", "25",
    "53", "67", "68", "69", "79", "80", "88",
    "106", "110", "111", "113", "115", "119", "123", "137", "138", "143", "161", "192",
    "311", "312", "389", "427", "443", "445", "464", "500", "514", "515", "532", "548", "554", "587",
    "600", "623", "625", "626", "631", "636", "660", "687", "749", "985", "993", "995", "1085", "1099", "8043", "1220", "1640", "1649", "1701", "1723", "1900",
    "2049", "2195", "2196", "2336", "3004", "3031", "3283", "3306", "3478", "3497", "3632", "3659", "3689", "3690",
    "4111", "4398", "4488", "4500", "5003", "5009", "5060", "5100", "5190", "5222", "5223", "5269", "5297", "5298", "5350", "5351", "5353", "5432", "5678", "5897", "5898", "5900", "5988",
    "6970", "9999", "7070", "7777", "8000", "8999", "8005", "8008", "8080", "8085", "8087", "8088", "8089", "8096", "8170", "8171", "8175", "8443", "8800", "8843", "8821", "8826", "8891",
    "9006", "9100", "9418", "11211", "16080", "16384", "16403", "16387", "16393", "16402", "16472", "24000", "24999", "33001", "42000", "42999", "49152", "65535", "50003", "50006"
];

exports.getReservedPorts = function () {
    return {
        status: true,
        command: 'getRestrictedPorts',
        type: typeof(reservedPorts),
        data: reservedPorts
    };
};

function _validateHost(host, vhosts, callback) {
    var port = host.port,
        directory = host.directory,
        result = {
            status: true,
            msg: ''
        };

    // check not reserved
    if (reservedPorts.indexOf(port.toString()) > 0) {
        result.status = false;
        result.msg += 'Port is reserved!'
    }

    // check not in use
    var existingSite = vhosts.filter(function (x) {
        return x.port === port;
    });

    if (existingSite.length > 0) {
        result.status = false;
        result.msg += ' Port is already in use!'
    }

    // check directory exists
    if (!fs.existsSync(directory)) {
        result.msg += ' Requested directory [' + directory + '] does not exist!';
        result.status = false;
    }
    return callback(result);
}

function _command(cmd, dir, cb) {
    exec(cmd, {
        cwd: dir
    }, function (err, stdout) {
        cb(stdout.split('\n').join(''));
    });
}

function _gitTag(dir, cb) {
    _command('git describe --always --tag --abbrev=0', dir, cb);
}

function _gitURL(dir, cb) {
    _command('git config --get remote.origin.url', dir, cb);
}

function _getAdditionalInfo(host, callback) {
    // TODO talk to Robin about how to do this
    var appPackageJsonPath = host.directory + '/package.json';
    if (pathEndsWith(host.directory, 'app')) {
        appPackageJsonPath = path.normalize(host.directory + '/../package.json');
    }

    if (fs.existsSync(appPackageJsonPath)) {
        var appPackageJson = require(appPackageJsonPath);
        if (appPackageJson.templateVersion !== undefined) {
            host.isIpadApp = true;
        }
    }

    // TODO find docs file
    host.hasDocs = fs.existsSync(host.directory + '/docs');

    callback(null);
}
