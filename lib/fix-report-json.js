#!/usr/bin/env node

var fs = require('fs-extra'); // filesystem library
var beautify = require('js-beautify').js_beautify;
var merge = require('merge');
var DU = require('./utils');
var S = require('string');

var outputFile = '$REPO/app/assets/custom/data/emailTemplates/emailSummaryData.json';
var reportFile = null; // name of engine

var config = {
	language : 'en',
	repoPath : null, // path to top of repo
	reportFile : null // path to engine
};

/**
 *
 */
function outputReferences(data) {
	var output = DU.replacePathMarker(outputFile, config);
	fs.writeFileSync(output, beautify(data));
	console.log('Written BC inputs to ' + output);
}

/**
 *
 */
function modifyReferences(data){
	data = S('{"inputReferences": [' + data + ']}');
	data = data.replaceAll('{InputRef:', '{"InputRef":');
	data = data.replaceAll(',BCRef:', ',"BCRef":');
	data = data.replaceAll('xlew_', 'XLEW_');
	data = data.replaceAll("'", '"');
	return data.s;
}

/**
 * Generate app pages runner
 * Load engine file, call sub-funcitons.
 */
function run(err, data){
	console.log('Report: '+config.reportFile);
	console.log('');

	data = modifyReferences(data);
	outputReferences(data);
}

exports.fix = function (newConfig){
    config = merge(config, newConfig);
    //console.log(config);
    fs.readFile(config.reportFile, 'utf8', run);
};
