"use strict";

var fs = require('fs');
var tilde = require('tilde-expansion');

exports.directories = function (req, res) {
    if (req.body.path) {
        var rootDirs = _getDirectories(req.body.path);
        var retObj = {
            path: req.body.path,
            dirs: rootDirs
        };
        res.send(retObj);
    } else {
        tilde('~', function (s) {
            var home = s;
            var rootDirs = _getDirectories(s);
            var retObj = {
                path: home,
                dirs: rootDirs
            };
            res.send(retObj);
        });
    }
};

function _getDirectories(path) {
    return fs.readdirSync(path).filter(function (file) {
        return fs.statSync(path + '/' + file).isDirectory() && file.substring(0, 1) !== '.';
    });
}
