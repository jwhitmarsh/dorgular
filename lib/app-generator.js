/**
 * Excel to App Generator
 * Copyright (c) 2014 Abacus International Ltd.
 */
var assert = require('assert');
var cheerio = require('cheerio'); // HTML mangler, jQuery like syntax
var fs = require('fs-extra'); // filesystem library
var S = require('string'); //string manipulation library
var beautify_html = require('js-beautify').html;
var jf = require('jsonfile'); // read/write json files
var util = require('util');
var merge = require('merge');
var EE = require('./engine-extractor'); // include our engine extractin library.
var DU = require('./utils'); //dora utils library

var outputDir = '$REPO/app/assets/custom/html/$INSTANCE/';
var outputFile = '$PAGE.html';
var appPagesFile = '$REPO/app/assets/custom/scripts/$INSTANCE/structure.json';
var pageStructure = null;
var config = {
	instanceName : 'default',
	language : 'en',
	usePageNames : true, // use page names in structure.json instead of numeric ids
	extractEngine: true, // post-geration, extract engine
	appRepoPath : null,
	engineFile : null // name of engine
};
var converter = {version:'5', client:''}; // store version of spreadsheet converter used here.
var $ = null; // html data as loaded by cheerio
var pages = []; // array of {title:{title Object}, data:{page Object} }
var pageTemplate = null; // holder for templates/page.html
var popupTemplate = null; // holder for templates/popup.html

/**
 * Output modified page to file.
 * Create sub-directories for defined instance and language if necessary.
 * @param {object} page object containing page title and data.
 */
function outputHTML(page){
	//handle instance, language
	var targetDir = DU.replacePathMarker(outputDir, config);//.replace('$INSTANCE', config.instanceName);

	// get slugified page name
	var slugged = S(page.title.html()).slugify().s;

	if (S(slugged).startsWith('mf-')){
		targetDir +='pages/';
	}else{
		targetDir +='popups/';
	}

	// create target dir if necessary
	if(!fs.existsSync(targetDir)){
		fs.mkdirsSync(targetDir);
		console.log('Created output directory: %s', targetDir);
	}

	// write file
	var filename = outputFile.replace('$LANG', config.language);
	filename = filename.replace('$PAGE',slugged);
	filename = targetDir + filename;

	var data = S(page.data.html())
    	.replaceAll('xlew_', 'XLEW_')
		.replaceAll('&#x27;', "'")
		.replaceAll('&#xA0;', '')
		.replaceAll('&#xA9;', '&copy;')
		.replaceAll('<col>', '')
		.replaceAll('&apos;', "'")
		.replaceAll('<span></span>', "").s;


	fs.writeFileSync(filename, beautify_html(data, {'preserve_newlines':false}));
	console.log('Written html to ' + filename);
}

/**
 * get page names for 'sheet' titles
 * Create page object and push to page collection
 */
function cacheSheetNames() {
	switch (converter.version) {
		case '6':
		case '7':
			var regex = /#([a-z0-9\-]*)/;
			$('#tab li a').each(function (i, elem){
				var $elem = $(elem);
				var link = $elem.attr('href');
				var title = $elem.text();
				link = link.match(regex)[1];
				//console.log('link:'+link+', title:'+title);
				pages.push({title:$elem, data:null, id:link});
			});
			break;
		default:
			$('.yui-nav li em').each(function(i, elem){
				pages.push({title:$(elem), data:null, id:null});
			});
			break;
	}
}

/**
 * get sheet contents and cache in collection.
 */
function cacheSheets() {
	var i=0,len=0, $page=null, slugged = null;
	switch (converter.version) {
		case '6':
		case '7':
			for(i, len = pages.length; i<len; i++){
				slugged = S(pages[i].title.html()).slugify().s;

				//var $page = cheerio.load('<div class="page-inner"><div class="main-heading"><h2>'+pages[i].title.html()+'</h2></div><div class="content-container">Temporary markup, please replace :)</div></div>');
				if(S(slugged).startsWith('mf-')){
					pages[i].isPopup = false;
				}else{
					pages[i].isPopup = true;
				}

				if(!pages[i].isPopup){
					$page = cheerio.load(pageTemplate);
					$page('h2').html(pages[i].title.html());
					$page('.content-container').append($('#'+pages[i].id).html());
				}else{
					$page = cheerio.load(popupTemplate);
					$page('h2').html(pages[i].title.html());
					$page('.abacus-modal').attr('id', slugged);
					$page('.modal-content').append($('#'+pages[i].id).html());
				}
				//console.log($page.html());

				pages[i].data = $page;
				pages[i].slugged = slugged;
			}
			break;
		default:
			$('.printclass').each(function(i, elem){
				var $page = cheerio.load('<div class="page-inner"><div class="main-heading"><h2>'+pages[i].title.html()+'</h2></div><div class="content-container">Temporary markup, please replace :)</div></div>');
				$page('.content-container').append($(elem).html());
				//console.log($page.html());

				pages[i].data = $page;
			});
			break;
	}
}

/**
 * Modify engine inputs to suit iPad.
 * Remove unwanted attributes.
 * Add number keyboard pattern
 * Update onclick handler.
 */
function modifyInputs() {
	var i=0,
		len=0,
		$pageData = null,
		inputHTML = null;

	var badAttrs = {
		table:['style','cellspacing','cellpadding','width','onkeydown'],
		tr:['style'],
		td:['style','class','sheetid','rowid','colid','width', 'colspan'],
		col:['sty;e', 'width'],
		input:['style','class','tabindex','onkeydown','name','downkey','upkey','placeholder','data-sheet','data-row','data-col'],
		span:['style']
	};

	for (i,len=pages.length; i < len; i++){
		$pageData = pages[i].data;
		$pageData('input').each(function(i, elem){
			var $input = $(elem);

			// remove unwanted attributes
			for (var j = 0; j < badAttrs.input.length; j++){
				$input.removeAttr(badAttrs.input[j]);
			}

			// get onchange event text, wrapp in string handler
			inputHTML = S($input.attr('onchange'));

			// NB: readonly inputs do not have an onchange, so this can be undefined
			if(inputHTML.s !== undefined){

				if (inputHTML.contains("eedisplayPercent") || inputHTML.contains("eedisplayFloat")){
					$input.attr('pattern', '[0-9]*');
				}

				// update onclick handler
				inputHTML = inputHTML.replace('recalc_onclick', 'app.engine.recalc');
				inputHTML = inputHTML.replace('setValueofBtn();', '');
				$input.attr('onchange', inputHTML);
			}

			// fix case of input identifier as upper case
			$input.attr('id', $input.attr('id').toUpperCase());
		});

		// clean up table elements
		$pageData('table').each(function(i, elem){
			var $table = $(elem);

			// remove unwanted attributes
			for (var j = 0; j < badAttrs.table.length; j++){
				$table.attr(badAttrs.table[j], null);
			}

			$table.find('colgroup tbody').each(function (i, e){
				$table.append(e);
			});
			$table.find('colgroup').remove();
		});

		$pageData('col').each(function(i, elem){
			var $col = $(elem);

			// remove unwanted attributes
			for (var j = 0; j < badAttrs.col.length; j++){
				$col.removeAttr(badAttrs.col[j]);
			}
		});

		// clean up table row data elements
		$pageData('td').each(function(i, elem){
			var $td = $(elem);

			// remove unwanted attributes
			for (var j = 0; j < badAttrs.td.length; j++){
				$td.removeAttr(badAttrs.td[j]);
			}

			// if td contains a TAG_nnn, replace with <restag>
			var text = $td.text();
			text = S(text).replaceAll('tag_', 'TAG_').replaceAll('Tag_', 'TAG_').s;

			if (S(text).contains('TAG_')) {
				var regex = /[\s]*TAG_([0-9]*)/;
				$td.html(text.replace(regex, '<ref id="tag_$1" class="restag"/>'));
			}

			// check if td contains a div with inputs, if so, move inputs, remove div.
			$td.find('div input').each(function (i, el){
				$td.append(el);
			});
			$td.find('div').remove();
		});

		// clean up table row elements
		$pageData('tr').each(function(i, elem){
			var $tr = $(elem);

			// remove unwanted attributes
			for (var j = 0; j < badAttrs.tr.length; j++){
				$tr.removeAttr(badAttrs.tr[j]);
			}

			var target = $tr.children().length;
			var empty = 0;
			$tr.children().each(function (i, elem){
				if($(elem).is(':empty')){
					empty++;
				}
			});

			if (target === empty){
				//tr is full of empty tds, remove it.
				$tr.remove();
			}

		});


		// clean up span elements
		$pageData('span').each(function(i, elem){
			var $span = $(elem);

			// remove unwanted attributes
			for (var j = 0; j < badAttrs.span.length; j++){
				$span.removeAttr(badAttrs.tr[j]);
			}
		});
	}
}

/**
 * Does this level of the page strcture containing an element with `id`?
 * @param {array} structure grouping level of structure
 * @param {string} id target id
 * @return {boolean} true for present
 */
function hasElement(structure, id){
	var found = false;
	var element = null, i=0,len=structure.length;

	while(!found && i < len){
		element = structure[i];
		if (element.ID === id){
			found = true;
		}
		i++;
	}
	return found;
}

/**
 * Read in, modify and write out `appPageStructure.json`.
 * Update with new pages.
 */
function updatePageStructure(){
	var foundModel = false;
	var data = null;
	var page = null;
	var title = '';
	var slugged = ''; // slugified title, is usePageName is true, use this instead of generated id.
	var pageOffset = 0;
	var i = 0, len = 0;

	// load json file into local object
	var instanceStructure = DU.replacePathMarker(appPagesFile, config);//.replace('$INSTANCE', config.instanceName);
	pageStructure = jf.readFileSync(instanceStructure);
	data = pageStructure.structureData;
//	popups = data.popups

	/*
	for (i = 0, len = pageStructure.structureData.length; i< len; i++){
		data = pageStructure.structureData[i];
		console.log(util.inspect(data));
		console.log(data.instanceID);

		if (data.instanceID === config.instanceName){
			foundModel = true;
			break;
		}
	}

	// if there is no matching instance, create a new data object
	// and append to pageStructure
	if (!foundModel) {
		data = {
			instanceID:config.instanceName,
			childElements:[]
		};

		pageStructure.structureData.push(data);
	}else{
		pageOffset = data.childElements.length;
	}
	*/

	// loop over 'pages' and add new pages to childElements array
	for (i = 0, len = pages.length; i < len; i++){
		page = pages[i];
		title = S(page.title.html());

		if (!page.isPopup){
			if (!hasElement(data.childElements, page.slugged)){
				data.childElements.push({
					ID: (config.usePageNames ? page.slugged : "p"+(i+1+pageOffset)),
					class: "",
					attributes: [],
					contentFilename: page.slugged,
					orderX: (i+pageOffset),
					orderY: 0,
					title: title.s,
					shortTitle: title.s,
					navigationGroup: (i+pageOffset),
					showInNavigation: true,
					popups: [],
					childElements: [],
					partialElements: []
				});
			}
		}else{
			if (!hasElement(data.popups, page.slugged)){
				// this is a popup. add it to the instance-wide popups
				data.popups.push({
					ID: page.slugged,
					class: "",
					attributes: [],
					contentPath: config.instanceName+"/popups",
					contentFilename: page.slugged 
				});
			}

		}
	}

	jf.writeFileSync(instanceStructure, pageStructure);
}

/**
 * Loop over pages and output as HTML file.
 */
function outputFiles(){
	var i = 0, len = 0;
	for(i=0, len = pages.length; i < len; i++){
		//console.log('pageName: %s', pageNames[i]);
		//console.log('page: %s', pages[i]);
		outputHTML(pages[i]);
	}
}

/**
 * Generate app pages runner
 * Load engine file, call sub-funcitons.
 */
function run(err, data){
	// check we have engine data
	if (!data || data === undefined){
		console.error("Failed to load [%s]. Typo in file name or path?", config.engineFile);
		process.exit(-1);
	}

	var i = 0,len = 0, allowedConverters=['5','6', '7'];
	console.log('Engine: '+config.engineFile);
	console.log('Model: '+config.instanceName);
	console.log('Language: '+config.language);

	//load templates...
	pageTemplate = fs.readFileSync('not-in-build/templates/page.html', {encoding:'utf-8'});
	popupTemplate = fs.readFileSync('not-in-build/templates/popup.html', {encoding:'utf-8'});

	$ = cheerio.load(''+data+'');

	if ($.html() === "undefined"){
		console.error("Failed to load into cheerio [%s]. Typo in file name or path?", config.engineFile);
		process.exit(-3);
	}

	// get spreadsheet converter version
	converter.client = $('#xl_client').val();

	// parse client as verion, should in format of x6.10.5544.0. NB first character my be an 'h' for version 5
	converter.version = converter.client.substring(1, converter.client.indexOf("."));
	console.log('Converter: '+converter.client);
	console.log('');

	// check if converter version is correct
	if (allowedConverters.indexOf(converter.version) === -1){
		console.error('Bad converter version! Allowed versions:'+allowedConverters);
		process.exit(-1);
	}

	cacheSheetNames();
	cacheSheets();
	modifyInputs();
	outputFiles();
	updatePageStructure();

	// extract engine if necessary
	if(config.extractEngine){
		EE.extract(config);
	}
}

/**
 * Entry point to library.
 * @param {object} newConfig new settings
 */
exports.generate = function (newConfig){
	config = merge(config, newConfig);
	console.log(config);
    fs.readFile(config.engineFile, 'utf8', run);
};
