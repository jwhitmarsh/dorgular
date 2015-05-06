#!/usr/bin/env node

var stdio = require('stdio');
var read = require('read');

var vhoster = require('../lib/vhoster/vhoster');

var dora = require('../project-explorer/server/lib/generate');
var ops = stdio.getopt({
    'port': {
        description: 'port number',
        key: 'p',
        mandatory: false,
        args: 1
    },
    'name': {
        description: 'Name of the site',
        key: 'n',
        mandatory: false,
        args: 1
    },
    'directory': {
        description: 'Path to site',
        key: 'd',
        mandatory: false,
        args: 1
    },
    'list': {
        description: 'list sites',
        key: 'l',
        mandatory: false,
        args: 0

    },
	'remove':{
        description: 'remove virtual host by port or name',
        key: 'r',
        mandatory: false,
        args: 1
	},
	'edit':{
        description: 'edit virtual host by port or name. args are <siteID> <name> <port> <directory>',
        key: 'e',
        mandatory: false,
        args: 4
	},
	'debug':{
        description: 'Enable debug messages',
        key: 'D',
        mandatory: false,
        args: 0
	},
	'reset':{
        description: 'Reset Apache files back to factory defaults',
        key: 'R',
        mandatory: false,
        args: 0
	},
	'test':{
		description: 'dev testing',
		key: 't',
		mandatory: false,
		args:0
	}
});

function main() {
	read({prompt:'Password:', silent: true}, run);
	//run(null, 'W3lc0me!23456');
}

function run (error, input, isDefault){
	if (isDefault || error || !input || input === undefined){
		console.error('No password, exiting');
		process.exit(-1);
	}

	if(ops.debug){
		vhoster.enableDebug();
	}

	// initialise security
	vhoster.security({password:input});

	var result = null; // expects a result object {status:boolean, command:'', type:'data type', data:*}
	var kickDora = true;
    if (process.argv.length === 2) {
        stdio.question('Site name?', function(err, name) {
            stdio.question('Port number?', function(err, port) {
                stdio.question('Directory to path?', function(err, directory) {
					result = vhoster.add(name, parseInt(port), directory);
                });
            });
        });
    }else{
		if(ops.list){
			result = vhoster.list();
			kickDora = false;
		}else if (ops.remove) {
			result = vhoster.remove(ops.remove);
		}else if(ops.edit){
			result = vhoster.edit(ops.edit[0], ops.edit[1], ops.edit[2], ops.edit[3]);
		}else if(ops.reset){
			result = vhoster.reset();
		}else if (ops.port && ops.name && ops.directory){
			result = vhoster.add(ops.name, ops.port, ops.directory);
		}else if(ops.test){
			//vhoster.security({password: 'W3lc0me!23456'});
			result = vhoster.getHosts();
			console.log(result);
		}else{
			stdio.question('Site name?', function(err, name) {
				stdio.question('Port number?', function(err, port) {
					stdio.question('Directory to path?', function(err, directory) {
						result = vhoster.add(name, parseInt(port), directory);
					});
				});
			});
		}
		finish();
	}

	function finish() {
		vhoster.releaseSecurity(true);
		if (!result.status){
			console.error('Exiting due to error: '+result.command+':'+result.msg);
			process.exit(-1);
		}

		if (result.msg){
			console.log(result.command +':'+result.msg);
		}

		if(kickDora){
			process.chdir('../project-explorer');
			dora.generate();
		}
	}
}

main();
