#!/usr/bin/env node

var fs = require('fs-extra'); // overloaded filesystem library
var S = require('string'); //string manipulation library
var beautify = require('js-beautify').js_beautify;
var merge = require('merge');
var DU = require('./utils');

var outputDir = '$REPO/app/assets/custom/data/languages/';
var languages = [];

var config = {
	repoPath:null,
	csvFile:null // path to file with translations
};

/**
 * Convert unicode into relvant HTML entities.
 * This *will not* escape the embedded HTML.
 */
function escapeHTMLEntities(str){
	str = str.replace(/\u00AE/g, '&reg;');
	str = str.replace(/\u00A7/g, '&sect;');
	str = str.replace(/\u00C4/g, '&Auml;');
	str = str.replace(/\u00CB/g, '&Euml;');
	str = str.replace(/\u00CF/g, '&Iuml;');
	str = str.replace(/\u00D6/g, '&Ouml;');
	str = str.replace(/\u00DC/g, '&Uuml;');
	str = str.replace(/\u00DF/g, '&szlig;');
	str = str.replace(/\u00E4/g, '&auml;');
	str = str.replace(/\u00EB/g, '&euml;');
	str = str.replace(/\u00FF/g, '&iuml;');
	str = str.replace(/\u00F6/g, '&ouml;');
	str = str.replace(/\u00FC/g, '&uuml;');
	return str;
}

/**
 * Loop over `languages` object and output data to files.
 */
function outputLanguages() {
	for (var i = 0; i < languages.length; i++){
		var lang = languages[i];
		var outputFile = DU.replacePathMarker(outputDir + lang.lang + '.json', config);
		fs.outputJson(outputFile, lang.strings);
		console.log('Written json to ' + outputFile);
	}
}

/**
 * read first line
 *  id/LANG/.../Comments
 *  so check what the headers are, if they start with 'comment' ignore/stop.
 *
 * Read remaining rows, parse out id append this to output string:
 * {"id":"number", "Text":"translated string"}
 * create output string per language, store by key in `languages` object.
 */
function splitTranslations(data){
	var i=0, len=0;

	// split raw data into array of strings
	var lines = data.split('\r');

	//console.log(string(data).lines().length);

	// get header, split of comma
	var headers = lines[0].split('\t');

	// find language codes in header, ignore first column (id) and any columns starting with 'comment'
	for (i=1; i<headers.length; i++){
		var header = headers[i].toUpperCase();
		if (header.indexOf('COMMENT') === -1){
			languages[i-1] = {lang:header, strings:[]};
		}else{
			break;
		}
	}

	// cache number of languages
	var numLangs = languages.length;

	for(i=1, len = lines.length; i<len; i++){
		var line = lines[i].split('\t');
		//console.log('line:'+line);
		// line comprises of 'id'|lang1¬lang2|...
		var id = S(line[0]).trim().s;
		if (id && id !== undefined){
			for (var s=0; s<numLangs; s++){
			//	console.log('s:'+line[s+1]);
				var str = line[s+1];
				if(str && str !== undefined){
					str = S(str).trimLeft().s;
				}else{
					str='';
				}
				languages[s].strings.push({'id':id, 'text':escapeHTMLEntities(str)});
			}
		}
	}

	return data;
}

/**
 * Load translation file, call sub-functions.
 */
function run(err, data){
	console.log('Translation File: '+config.csvFile);
	console.log('');

	data = splitTranslations(data);
	outputLanguages();
}

exports.extract = function (newConfig){
    config = merge(config, newConfig);
	fs.readFile(config.csvFile, 'ucs-2', run);
};
