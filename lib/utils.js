var path = require('path');
var git = require('git-rev-sync'); // easy access to git tags

function displayTag(){
	var cwd = process.cwd();
	process.chdir(__dirname);
	console.log('Version: %s', git.tag());
	process.chdir(cwd);
}

function displayFullVersion(){
	var cwd = process.cwd();
	process.chdir(__dirname);
	console.log('Full Version: %s-%s-%s', git.branch(), git.tag(), git.short());
	process.chdir(cwd);
}

function replacePathMarker(_path, config) {
    if (config.repoPath !== undefined) {
        _path = _path.replace('$REPO', config.repoPath);
    }
    if (config.instanceName !== undefined) {
        _path = _path.replace('$INSTANCE', config.instanceName);
    }
    if (config.language !== undefined) {
        _path = _path.replace('$LANG', config.language);
    }
    return path.normalize(_path);
}

module.exports = {
	replacePathMarker:replacePathMarker,
	displayTag:displayTag,
	displayFullVersion:displayFullVersion
};
