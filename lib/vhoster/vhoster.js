/**
 * vhoster core
 */
var path = require('path');
var S = require('string');
var fs = require('fs');
var fsextra = require('fs-extra');
var util = require('util');
var os = require('os');
var async = require('async');
var shell = require('shelljs');

var hostsFile = "/etc/hosts";
var vhostsFile = "/etc/apache2/extra/httpd-vhosts.conf";
var osVersion = os.release().substring(0, os.release().indexOf('.'));

//vars
var hostPattern = ".*host start.*",
    lines = [],
    vhosts = [],//cached hosts
    sudoInfo = {password:'', enabled:false};

// set to true for verbose output
var debug = false;

var defaultResult = {
	status:true, //if false, then 'msg' is an error string
	type:null,
	data:null,
	command:null,
	msg:null
};
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

console.log('Virtual host management tool.');
console.log('OS Version:'+osVersion+'.\n');

exports.enableDebug = enableDebug = function (){
	debug = true;
};

/**
 *
 */
function logger(msg){
	if(debug){
		console.log('DBG: '+msg);
	}
}
/**
 * Read file into array of strings.
 * @param {string} file file name
 * @param {?pattern} pattern optional pattern to control chich lines are returned
 * @param {?function} callback optional function to call back
 * @return {array} array of strings from file
 */
function readFile(file, pattern, callback) {
	logger('readFile: '+file);
    pattern = pattern !== undefined ? pattern : null;
    callback = callback !== undefined ? callback : null;

    var data = fs.readFileSync(file, {
        encoding: 'utf-8'
    });
    data = S(data).lines();
    var line = null;

    while (lines.length) {
        lines.pop();
    }

    if (pattern) {
        for (var i = 0, len = data.length; i < len; i++) {
            line = data[i];
            if (line.match(pattern)) {
                lines.push(line);
            }
        }
    } else {
        lines = data;
    }

	logger('readFile:lines:'+lines);

    if (callback) {
        callback();
    }
    return lines;
}

/**
 * Cache host details from `httpd-vhosts.conf` file.
 */
function cacheHosts() {

	/*
<VirtualHost *:2477>
	ServerName "bar"
	DocumentRoot "/Users/rtregaskis/work/app-template/app/"
</VirtualHost>
*/
    var strArr = null,
        name = null,
        port = null,
		directory = null,
		capturing = false;
	var vhost = null;
	vhosts = [];

    for (var i = 0, len = lines.length; i < len; i++) {
		var line = lines[i];
		if (line.indexOf('<VirtualHost *:') !== -1){
			vhost = {};
			vhost.port = line.substring(line.indexOf(':')+1, line.length - 1);
			line = lines[++i];
			vhost.name = line.substring(line.indexOf('"')+1, line.length - 1);
			line = lines[++i];
			vhost.directory = line.substring(line.indexOf('"')+1, line.length - 1);
			vhosts.push(vhost);
		}
    }
	return vhosts;
}

/**
 * Check if siteID is present in `lines`.
 * @todo need to rework how lines is used.
 * @param {string}
 * @return {boolean} true for present
 */
function checkExistingSite(siteID) {
    var result = false;
    var target = S(siteID).s;
    var lines = readFile(hostsFile, hostPattern);
    for (var i = 0, len = lines.length; i < len; i++) {
        //console.log('CVH: %s:%s:%d', lines[i], target,lines[i].indexOf(target));
        if (lines[i].indexOf(target) !== -1) {
            result = true;
            break;
        }
    }
    return result;
}

/**
 * Check port number against reserved list.
 * If we have a hit, warn the user, then make a suggestion, i.e. 100 + port
 * list taken from: http://support.apple.com/kb/HT6175?viewlocale=en_US
 * NB: port 33001 is used by the project-explorer
 * @param {integer} port port nubmer
 * @return {integer} port or modified version;
 */
function checkReservedPorts(port) {
    console.log("Check if port [%d] is valid...", port);
    var bad = false;

    if (reservedPorts.indexOf(port.toString()) === -1) {
        console.log("Port [%d] appears valid", port);
    } else {
        port = parseInt(port) + 100;
        console.log('Port is in reserved list, trying [%d] instead...', port);
        port = checkReservedPorts(port);
    }
    return port;
}

/**
 * Write details to `hostsFile` and `vhostsFile`
 * @param {string} name site nickname
 * @param {string} port number of port to listen on.
 * @param {string} directory path to site
 */
function outputVirtualHost(name, port, directory) {
    var data = fs.readFileSync(vhostsFile, {
        encoding: 'utf-8'
    });
    data = S(data).lines();

    console.log("Append site details to %s", vhostsFile);
    data.push("# Virtual host start $NAME $PORT");
    data.push("Listen $PORT");
    data.push("NameVirtualHost *:$PORT");
    data.push("");
    data.push("<Directory \"$DIR\">");
    data.push("Allow From All");
    data.push("AllowOverride All");
    data.push("Options +Indexes");
    data.push("</Directory>");
    data.push("<VirtualHost *:$PORT>");
    data.push("	ServerName \"$NAME\"");
    data.push("	DocumentRoot \"$DIR\"");
    data.push("</VirtualHost>");
    data.push("# Virtual host end $NAME");
    data.push("");

    data = data.join("\n");
    data = data.replace(/\$NAME/gm, name);
    data = data.replace(/\$PORT/gm, port);
    data = data.replace(/\$DIR/gm, directory);

    logger('outputVhost:1:'+data);
	
    var tmpVhosts = '/tmp/vhosts';
    fs.writeFileSync(tmpVhosts, data);
    sudoExec('cp ' + tmpVhosts + ' ' + vhostsFile);

    data = fs.readFileSync(hostsFile, {
        encoding: 'utf-8'
    });
    data = S(data).lines();
    // append details to /etc/hosts
    console.log("Append site details to %s", hostsFile);
    data.push("# Virtual host start $NAME $PORT");
    data.push("127.0.0.1 $NAME");
    data.push("fe80::1%lo0 $NAME");
    data.push("# Virtual host end $NAME");
    data.push("");

    data = data.join("\n");
    data = data.replace(/\$NAME/gm, name);
    data = data.replace(/\$PORT/gm, port);
    data = data.replace(/\$DIR/gm, directory);

    logger('outputVhost:2:'+data);
    var tmpHosts = '/tmp/hosts';
    fs.writeFileSync(tmpHosts, data);
    sudoExec('cp ' + tmpHosts + ' ' + hostsFile);
}

/**
 * See if the httpd.conf matches what we want.
 * If not, copy over our modified version.
 * OS version dependant :(
 */
function checkConfig() {
	logger('checking apache config');
	var here = shell.pwd();
	if (here.indexOf('vhoster') === -1){
		logger('Not in vhoster, changing directory.');
		shell.cd('../vhoster');
	}
    if (!fs.existsSync('/etc/apache2/httpd.conf.abacus')) {
        if (!fs.existsSync('/etc/apache2/.abacus')) {
			logger('Default config found, overwrite with new config...');
			async.series([
				function (cb){
            		sudoExec("touch /etc/apache2/extra/httpd-vhosts.conf");
					cb(null, 'httpd-vhosts.conf touched');
				},
				function (cb){
            		sudoExec("cp -f new-configs/httpd-vhosts.conf /etc/apache2/extra/httpd-vhosts.conf");
					cb(null, 'httpd-vhosts.conf updated');
				},
				function (cb){
            		sudoExec("cp -f new-configs/httpd.conf." + osVersion + " /etc/apache2/httpd.conf");
					cb(null, 'httpd.conf updated');
				},
				function (cb){
            		sudoExec("touch /etc/apache2/.abacus");
					cb(null, '.abacus updated');
				}
			], 
			function (err, results){
				//console.log(err);
				//console.log(results);
			}
			);
			restartApache();
        }
    }
	shell.cd(here);
}

/**
 * Similiar to jQuery.extend
 * @param {*} a 'thing' to clone
 * @return cloned object
 */
function clone(a) {
   return JSON.parse(JSON.stringify(a));
}

/**
 * Heavy duty `is this really a number?`
 * @deprecated
 * @param {*} value item of interest
 * @return {Number|NaN}
 */
filterInt = function(value) {
    if (/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
        return Number(value);
    return NaN;
};

/**
 * Remove site details from specified file.
 * @param {string} siteID name or port number
 * @param {string} file file name to modifiy.
 */
function removeHost(siteID, file) {
	logger('remove host from file:'+ file);
    var target = S(siteID).s; //convert siteID to string
    var output = []; //hold the lines to write back.
    var capturing = false; //indicate line capture status
    var line = null; // current line
    var data = readFile(file); // get file data

    for (var i = 0, len = data.length; i < len; i++) {
        line = data[i];

        if (!capturing) {
            if (line.match("# Virtual host start") && line.indexOf(target) !== -1) {
                capturing = true;
            } else {
                output.push(line);
            }
        } else {
            if (line.match("# Virtual host end")) {
                capturing = false;
            }
        }
    }

    output = output.join("\n");
    var tmpFile = '/tmp/remHost';
    fs.writeFileSync(tmpFile, output);
    sudoExec('cp ' + tmpFile + ' ' + file);
	logger('host in file removed:'+ file);
}

/**
 * Add virtual host
 * @param {string} name site nickname
 * @param {string} port number of port to listen on.
 * @param {string} directory path to site
 * @return {boolean} true for success
 */
exports.add = add = function(name, port, directory) {
	var result = clone(defaultResult);
	result.command='add';

    // first, check if config is ours or not?
    checkConfig();

    console.log('Add site [%s:%s:%s]\n', name, port, directory);
    port = checkReservedPorts(port);
    if (checkExistingSite(port)) {
		result.status=false;
		result.msg='Port ['+port+'] already in use!';
		return result;
    }

    if (!fs.existsSync(directory)) {
        result.msg = 'Requested directory ['+directory+'] does not exist!';
		result.status = false;
        return result;
    }

    // write back new vhost
    outputVirtualHost(name, port, directory);

	restartApache();

    result.msg="Configuration complete, test site link: http://localhost:"+port;

    return result;
};

/**
 * Remove virtual host
 * @param {string} siteID name or port number
 * @return {boolean} true for success
 */
exports.remove = remove = function(siteID) {
	var result = clone(defaultResult);
	result.command = 'remove';

    console.log('Remove site [%s]\n', siteID);
    if (!checkExistingSite(siteID)) {
        console.error('Site identified by [%s] could not be found!', siteID);
		result.status=false;
		result.msg='Site identified by ['+siteID+'] could not be found!';
		return result;
    }

	async.series([
			function (cb){
    			removeHost(siteID, hostsFile);
				cb(null, 'one');
			},
			function (cb) {
    			removeHost(siteID, vhostsFile);
				cb(null, 'two');
			},
			function (cb) {
				restartApache();
				cb(null, 'three');
			}],
			function (err, results){
				console.log(err);
				console.log(results);
			}
			);

    result.msg = 'Site identified by ['+siteID+'] removed successfully.';
	return result;
};

/**
 * Edit virtual host identified by `siteID`.
 * @param {string} siteID name or port number
 * @param {string} name site nickname
 * @param {string} port number of port to listen on.
 * @param {string} directory path to site
 * @return {object} result object. 
 */
exports.edit = edit = function(siteID, name, port, directory) {
	var result = remove(siteID);
	if (result.status) {
        return add(name, port, directory);
    } 
    return result;
};

/**
 * List virtual hosts
 * @return {object} result
 */
exports.list = list = function() {
	var result = clone(defaultResult);
	result.command = 'list';
    console.log('List sites\n');
    var lines = readFile(hostsFile, hostPattern);
    for (var i = 0, len = lines.length; i < len; i++) {
        console.log(lines[i]);
    }
    result.msg = 'You should read use the project explorer, it is much ... prettier.';
	return result;
};


/**
 * Get virtual host details
 * @return {object} data is array
 */
exports.getHosts = getHosts = function () {
    readFile(vhostsFile, null, cacheHosts);
	return {
		status: true,
		command: 'getHosts',
		type:typeof(vhosts),
		data:vhosts
	};
};

/**
 * Reset hosts and vhosts files back to original
 * @return {object}
 */
exports.reset = reset = function() {
	var here = shell.pwd();
	if (here.indexOf('vhoster') === -1){
		logger('Not in vhoster, changing directory.');
		shell.cd('../vhoster');
	}
    //execSync("echo '" + sudoInfo.password + "' | sudo -S cp default-configs/hosts /etc/hosts; sudo cp default-configs/httpd.conf." + osVersion + " /etc/apache2/httpd.conf; sudo cp default-configs/httpd-vhosts.conf /etc/apache2/extra/httpd-vhosts.conf; sudo rm -f /etc/apache2/.abacus; sudo rm -f /etc/apache2/httpd.conf.abacus; sudo -K");
    sudoExec("cp default-configs/hosts /etc/hosts");
	sudoExec("cp default-configs/httpd.conf." + osVersion + " /etc/apache2/httpd.conf");
	sudoExec("cp default-configs/httpd-vhosts.conf /etc/apache2/extra/httpd-vhosts.conf");
	sudoExec("rm -f /etc/apache2/.abacus");
	sudoExec("rm -f /etc/apache2/httpd.conf.abacus");
	restartApache();
	releaseSecurity(true);
	shell.cd(here);
	return {status:true, msg:'Reset complete.', command:'reset'};
};

/**
 * Set sudo password.
 * @param {objec} deets {password:'fubar'}
 * @param {?function} callback function to call
 * @return {object} results object.
 */
exports.security = security = function(deets, callback) {
	releaseSecurity();
	var result = clone(defaultResult);
	result.command = 'security';

    if (!deets || deets === undefined) {
		result.status = false;
		result.msg = 'No security deets passed!';
		return result;
    }
    sudoInfo = deets;


	// get sudo access
	var e = shell.exec("echo '"+sudoInfo.password+"' | sudo -S whoami", {async:false});
	
	//console.log(e);
	if (e.code === 0){
		sudoInfo.enabled=true;
	}else{
		console.error('security failure!');
		releaseSecurity(true);
		result.status = false;
		result.msg = 'Incorrect security deets passed!';
	}

	return result;
};

/**
 * Kill previous sudo privileges.
 * Must be done prior to sudo command
 * @param {?boolean} clear removes cached password.
 */
exports.releaseSecurity =  releaseSecurity = function(clear) {
    // first off, kill sudo privileges
	shell.exec('sudo -K', {async:false});
	if(clear && clear !== undefined){
		sudoInfo.password = null;
		sudoInfo.enabled = false;
	}
};

/**
 * Run a command via sudo.
 * @param {string} cmd basic command to run, i.e 'ls'
 * @param {?function} callback funciton to call if `cmd` was successful
 * @param {?integer} timeout number of milliseconds to wait before callback it triggered, defaults to 200
 */
function sudoExec(cmd, callback, timeout) {
    timeout = (timeout === undefined) ? 200 : timeout;
    releaseSecurity();
	if(sudoInfo.enabled){
		cmd = "echo '"+sudoInfo.password+"' | sudo -S "+cmd;
		logger('sudoExec:'+cmd);
		shell.exec(cmd, {async:false, silent:true});
		if (callback !== undefined) {
			callback();
		}
	}
}

/**
 * restart apache so the changes take effect
 * @param {function} callback called if command is successful
 * @calls sudoExec
 */
restartApache = function(callback) {
    console.log('restartApache...');
    sudoExec('apachectl restart', callback, 500);
};

/**
 * Get reserved port list.
 * @return {object} results 
 */
exports.getReservedPorts = getReservedPorts = function (){
	return {
		status:true,
		command:'getRestrictedPorts',
		type:typeof(reservedPorts),
		data:reservedPorts
	};
};
