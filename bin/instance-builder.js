#!/usr/bin/env node

var stdio = require('stdio');
var DU = require('../lib/utils');
var IB = require('../lib/instance-builder');

var config = {
	instanceName : 'default',
	language : 'en',
	repoPath : null, // path to top of repo
	pageStructureFile : null // path to structure file
};

var ops = stdio.getopt({
    'version': {
        description: 'print version and exit',
        key: 'v',
        mandatory: false,
        args: 0
    },
    'repoPath': {
        description: 'Path to the application',
        key: 'r',
        mandatory: false,
        args: 1
    },
    'instance': {
        description: 'Name of the instance',
        key: 'i',
        mandatory: false,
        args: 1
    },
    'pages': {
        description: 'Comma separated string of page names, dot separated string of popups ie: page1,page2[pop1],page3[pop2.pop3]',
        key: 'p',
        mandatory: false,
        args: 1
    },
    'language': {
        description: 'Page language (defaults to en if not supplied)',
        key: 'l',
        mandatory: false,
        args: 1
    },
    'deleteInstance': {
        description: 'Delete the supplied instance',
        key: 'd',
        mandatory: false
    },
    'pageStructureFile': {
        description: 'Run off supplied page structure file',
        key: 's',
        mandatory: false
    }
});

function main() {
    console.log('Abacus Instance Builder.');
    console.log('Extract engine.js into your app from a converted spreadsheet.');
	DU.displayTag();

    try {
		if(ops.version){
			DU.displayFullVersion();
			process.exit();
		}

		if(!ops.repoPath){
			console.error('Missing argument: --repoPath');
			ops.printHelp();
			process.exit(-2);
		}
		
		if(!ops.instance){
			console.error('Missing argument: --instance');
			ops.printHelp();
			process.exit(-2);
		}
		
		config.repoPath = ops.repoPath;
		config.instance = ops.instance;

		if(ops.language){
			config.language = ops.language;
		}

        if (ops.deleteInstance) {
			config.pageStructureFile = ops.pageStructureFile;
            IB.deleteInstance(config);
            return;
        }

        //build from page structure file
        if (ops.pageStructureFile) {
            IB.buildFromPageStructure(config);
            return;
        }

		// if we are here, run the manual builder....
		IB.manualBuild(config);

    } catch (e) {
        console.log(e.stack);
    }
}

main();
