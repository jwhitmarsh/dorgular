#!/usr/bin/env node

// includes
var S = require('string'); // string mangling
var stdio = require('stdio'); // standard input/ouput
var EE = require('../lib/engine-extractor');
var DU = require('../lib/utils');

var config = {
	instanceName : 'default',
	outputMathFunctions : true, // boolean, if false, mathFunctions.js will *NOT* be updated.
	language : 'en',
	repoPath : null, // path to top of repo
	engineFile : null // path to engine
};

var ops = stdio.getopt({
    'version': {
        description: 'print version and exit',
        key: 'v',
        mandatory: false,
        args: 0
    },
    'noMaths': {
        description: 'do not generate mathFunctions.js',
        key: 'n',
        mandatory: false,
        args: 0
    },
    'instance': {
        description: 'name of instance to extract engine for, default is `default`',
        key: 'i',
        mandatory: false,
        args: 1
    },
    'lang': {
        description: 'language code, default is `en`',
        key: 'l',
        mandatory: false,
        args: 1
    },
    'engine': {
        description: 'path to converted engine HTML file',
        key: 'e',
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
    console.log('Abacus Engine Extractor.');
    console.log('Extract engine.js into your app from a converted spreadsheet.');
	DU.displayTag();

	if(ops.version){
		process.exit();
	}

	if(!ops.repoPath){
		console.error('Missing argument: --repoPath');
		ops.printHelp();
		process.exit(-2);
	}

	if(!ops.engine){
		console.error('Missing argument: --engine');
		ops.printHelp();
		process.exit(-2);
	}

	if (ops.instance){
		config.instance = S(ops.instance).slugify().s;
	}

	if(ops.language){
		config.language = ops.language;
	}

	if(ops.noMaths){
		config.outputMathFunctions = false;
	}

	// mandatory arguments
	config.repoPath = ops.repoPath;
	config.engineFile = ops.engine;

	// call extract, pass in config
	EE.extract(config);
}

// call main
main();
