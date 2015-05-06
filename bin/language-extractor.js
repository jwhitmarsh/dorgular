#!/usr/bin/env node

// includes
var S = require('string'); // string mangling
var stdio = require('stdio'); // standard input/ouput
var LE = require('../lib/fix-report-json');
var DU = require('../lib/utils');

var config = {
	repoPath : null, // path to top of repo
	csvFile : null // path to engine
};

var ops = stdio.getopt({
    'version': {
        description: 'print version and exit',
        key: 'v',
        mandatory: false,
        args: 0
    },
    'csvFile': {
        description: 'path to CSV file containing translations',
        key: 'c',
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
	console.log('Abacus Language Extraction Tool.');
	console.log('Convert CSV containing languages into separate JSON files.');
	DU.displayTag();

	if(ops.version){
		process.exit();
	}

	if(!ops.repoPath){
		console.error('Missing argument: --repoPath');
		ops.printHelp();
		process.exit(-2);
	}

	if(!ops.csvFile){
		console.error('Missing argument: --csvFile');
		ops.printHelp();
		process.exit(-2);
	}

	if (ops.instance){
		config.instance = S(ops.instance).slugify().s;
	}

	// mandatory arguments
	config.repoPath = ops.repoPath;
	config.csvFile = ops.csvFile;

	// call extract, pass in config
	LE.fix(config);
}

// call main
main();
