#!/usr/bin/env node

var S = require('string'); //string manipulation library
var stdio = require('stdio'); // standard input/ouput
var AG = require('../lib/app-generator'); // our generator library
var DU = require('../lib/utils');

var config = {
	instanceName : 'default',
	language : 'en',
	usePageNames : true, // use page names in structure.json instead of numeric ids
	extractEngine: true, // post-generation, extract engine
	repoPath : null, // path to repo
	engineFile : null // name of engine
};

var ops = stdio.getopt({
    'version': {
        description: 'print version and exit',
        key: 'v',
        mandatory: false,
        args: 0
    },
    'numeric': {
        description: 'use numeric page IDs instead of names, default is names',
        key: 'n',
        mandatory: false,
        args: 0
    },
    'noExtract': {
        description: 'do not extract engine',
        key: 'x',
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
	console.log('Abacus iPad App Generator.');
    console.log('Create flat basic styled app from converted spreadhseet.');
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

	if(ops.noExtract){
		config.extractEngine = false;
	}

	if(ops.numeric){
		config.usePageNames = false;
	}

	// mandatory arguments
	config.repoPath = ops.repoPath;
	config.engineFile = ops.engine;

	// call extract, pass in config
	AG.generate(config);
}

// call main
main();
