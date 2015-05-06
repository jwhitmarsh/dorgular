#!/usr/bin/env node

// includes
var S = require('string'); // string mangling
var stdio = require('stdio'); // standard input/ouput
var FR = require('../lib/fix-report-json');
var DU = require('../lib/utils');

var config = {
	instanceName : 'default',
	language : 'en',
	repoPath : null, // path to top of repo
	reportFile : null // path to engine
};

var ops = stdio.getopt({
    'version': {
        description: 'print version and exit',
        key: 'v',
        mandatory: false,
        args: 0
    },
    'reportFile': {
        description: 'path to Report.js file',
        key: 'f',
        mandatory: false, // this is a lie
        args: 1
    },
    'repoPath': {
        description: 'path to destination repo',
        key: 'r',
        mandatory: false, // this is a lie
        args: 1
    }
});

/**
 * Main function.
 * Parse command line arguments.
 * Call library code `extract` funciton. 
 */
function main() {
	console.log('Abacus iPad Business case reference fixer-upper.');
    console.log('Convert Report.js to correct format.');
	DU.displayTag();

	if(ops.version){
		process.exit();
	}

	if(!ops.repoPath){
		console.error('Missing argument: --repoPath');
		ops.printHelp();
		process.exit(-2);
	}

	if(!ops.reportFile){
		console.error('Missing argument: --reportFile');
		ops.printHelp();
		process.exit(-2);
	}

	if (ops.instance){
		config.instance = S(ops.instance).slugify().s;
	}

	// mandatory arguments
	config.repoPath = ops.repoPath;
	config.reportFile = ops.reportFile;

	// call extract, pass in config
	FR.fix(config);
}

// call main
main();
