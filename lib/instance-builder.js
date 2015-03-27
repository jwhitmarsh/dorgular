#!/usr/bin/env node

// TODO dupe default.html into newly created [instance].html
// TODO edit config file

var stdio = require('stdio');
var path = require('path');
var rimraf = require('rimraf');
var fs = require('fs-extra');
var replace = require('replace');
var merge = require('merge');
var DU = require('./utils');

var config = {
	instance : 'default',
	language : 'en',
	repoPath : null, // path to top of repo
	pageStructureFile : null // path to structure file
};

var customPath = "app/assets/custom";
var templatePath = path.join(__dirname, "../templates");
/////////////////////
// manual methods  //
/////////////////////

var manualBuild = function(newConfig) {
    config = merge(config, newConfig);
	//manual build process
	var instanceObj = {
		pageID: config.instance,
		childElements: [],
		popups: [],
		partialElements: []
	};

	var htmlPath = createHtmlFiles();
	var partialsPath = createPartials(htmlPath);
	var popupsPath = createPopups(htmlPath);

	var createPagesObj = createPages(htmlPath, popupsPath, instanceObj);
	instanceObj = createPagesObj.instanceObj;

	createScriptFiles(instanceObj);
	createStyleFiles();

	buildPageStructure(instanceObj);

	console.log('Finished!');
};

var createHtmlFiles = function() {
    console.log(config.repoPath, customPath, 'html', config.instance);
    var htmlPath = DU.replacePathMarker(path.join(config.repoPath, customPath, 'html', config.instance), config);

    //base html directory
    fs.ensureDirSync(htmlPath);

    //base html file
    var instanceTemplate = path.join(templatePath, 'instance.html'),
        instanceHtmlPath = path.join(htmlPath, config.instance + '.html');

    //move the file    
    fs.copySync(instanceTemplate, instanceHtmlPath);

    //replace template text
    replace({
        regex: '##instanceName##',
        replacement: config.instance,
        paths: [instanceHtmlPath],
        recursive: true,
        silent: true
    });

    return htmlPath;
};

var createPages = function(htmlPath, popupsPath, instanceObj) {
    //base pages file
    var pagesDir = path.join(htmlPath, 'pages');
    fs.ensureDirSync(pagesDir);

    if (!config.pageLanguage) {
        config.pageLanguage = 'en'; // set default
    }

    //pages
    var pagesLanguageDir = path.join(pagesDir, config.pageLanguage);
    fs.ensureDirSync(pagesLanguageDir);

    if (config.pages) {
        var pages = config.pages.split(',');
        for (var p = 0; p < pages.length; p++) {
            var pageName = pages[p],
                popArrStart = pageName.indexOf('['),
                popArrEnd = pageName.indexOf(']');

            //create the pageObj required for the pageStructureJson
            var pageObj = {
                ID: pageName,
                class: '',
                attributes: [],
                contentFilename: pageName,
                orderX: 0,
                orderY: 0,
                sectionTrackingTitle: pageName,
                sectionNavigationTitle: pageName,
                navigationGroup: 1,
                showInNavigation: true,
                popups: [],
                childElements: [],
                partialElements: []
            };

            // check if page has popups
            if (popArrStart > 0) {
                var parsedPageName = pageName.substr(0, popArrStart),
                    pagePopStr = pageName.substr(popArrStart + 1, (popArrEnd - popArrStart) - 1),
                    pagePopArr = pagePopStr.split('.');

                //make the page
                createPage(parsedPageName, parsedPageName, pagesLanguageDir);

                //reassign page name in the pageObj
                pageObj.ID = parsedPageName;
                pageObj.contentFilename = parsedPageName;
                pageObj.sectionNavigationTitle = parsedPageName;
                pageObj.sectionTrackingTitle = parsedPageName;

                //loop the popups
                for (var pp = 0; pp < pagePopArr.length; pp++) {
                    var popup = pagePopArr[pp];
                    createPopup(popup, popup, popupsPath);

                    var popupObj = {
                        ID: popup,
                        class: '',
                        attributes: [],
                        contentPath: '',
                        contentFilename: popup
                    };

                    //add the popups to the pageObj
                    pageObj.popups.push(popupObj);
                }
            } else {
                createPage(pageName, pageName, pagesLanguageDir);
            }
        }
    }else{
    	createPage('example-page', 'example-page', 'en');
	}

    return {
        pagesPath: pagesLanguageDir,
        instanceObj: instanceObj
    };
};

var createPopups = function(htmlPath) {
    //popups base dir
    var popupsDir = path.join(htmlPath, 'popups');
    fs.ensureDirSync(popupsDir);

    return popupsDir;
};

var createPartials = function(htmlPath) {
    //partials base dir
    var partialsDir = path.join(htmlPath, 'partials');
    fs.ensureDirSync(partialsDir);

    return partialsDir;
};

var createScriptFiles = function() {
    var scriptPath = path.join(config.repoPath, customPath, 'scripts', config.instance);

    //base script dir
    fs.ensureDirSync(scriptPath);

    //base .js files (copied from default)
    fs.copySync(path.join(config.repoPath, customPath, 'scripts/default/customFunctions.js'), path.join(scriptPath, 'customFunctions.js'));
    fs.copySync(path.join(config.repoPath, customPath, 'scripts/default/main.js'), path.join(scriptPath, 'main.js'));
    fs.copySync(path.join(config.repoPath, customPath, 'scripts/default/config.json'), path.join(scriptPath, 'config.json'));

    setupScriptFiles(scriptPath);
};

var setupScriptFiles = function(scriptPath) {
    // TODO more complicated object buildling, but for the time being, this'll do
    replace({
        regex: 'defaultConfig',
        replacement: config.instance + 'Config',
        paths: [scriptPath],
        recursive: true,
        silent: true
    });

    replace({
        regex: "pageID: 'default'",
        replacement: "pageID: '" + config.instance + "'",
        paths: [scriptPath],
        recursive: true,
        silent: true
    });
};

var createStyleFiles = function() {
    var cssPath = path.join(config.repoPath, customPath, 'styles', config.instance);

    //base css dir
    fs.ensureDirSync(cssPath);

    //base .css file
    writeFileSync(cssPath, config.instance + '.css');
};

var buildPageStructure = function(instanceObj) {
    var templateStructure = path.join(templatePath, 'structure.json');
    var structurePath = path.join(config.repoPath, customPath, 'scripts', config.instance, 'structure.json');
    var structureJson = JSON.parse(fs.readFileSync(templateStructure));

	console.log(structureJson);
	structureJson.structureData.instanceID = config.instance;
    structureJson.structureData.childElements.push(instanceObj);

    fs.writeJsonSync(structurePath, structureJson);
};

////////////////////////////
// page structure methods //
////////////////////////////
var buildFromPageStructure = function(newConfig) {
    config = merge(config, newConfig);
    var pageStructurePath = path.join(config.repoPath, customPath, 'data/pageStructure.json');
    var structureJson = JSON.parse(fs.readFileSync(pageStructurePath));
    var instanceJson = structureJson.pageStructureData.filter(function(x) {
        return x.pageID === config.instance;
    });

    if (!instanceJson.length) {
        throw new Error('Instance not found in pageStructure.json');
    }

    var htmlPath = createHtmlFiles();
    var pagesPath = createPages(htmlPath).pagesPath;
    var popupsPath = createPopups(htmlPath);
    var partialsPath = createPartials(htmlPath);
    var childElms = instanceJson[0].childElements;

    // TODO this only handles one level
    // talk to Mark about where pages.html go when it's multi level
    // find out why partials get paths in the pageStructure.json but pages don't
    for (var c = 0; c < childElms.length; c++) {
        var childElm = childElms[c];
        createPage(childElm.contentFilename, childElm.ID, pagesPath);

        //build any popups
        if (childElm.popups) {
            buildPopUps(popupsPath, childElm.popups);
        }
    }

    //build any popups
    if (instanceJson[0].popups) {
        buildPopUps(popupsPath, instanceJson[0].popups);
    }

    //script & style files
    createScriptFiles();
    createStyleFiles();

    log('Finished!');
};

///////////////////
// util methods  //
///////////////////

var createPage = function(pageFilename, pageId, pagesPath) {
    var fileName = pageFilename + '.html',
        filePath = path.join(config.repoPath, customPath, 'html', config.instance, 'pages', pagesPath, fileName),
        pageTemplate = path.join(templatePath, 'page.html');

//	console.log('create page', fileName, filePath, pageTemplate);
    fs.copySync(pageTemplate, filePath);
    replace({
        regex: '##TITLE##',
        replacement: pageId,
        paths: [filePath],
        recursive: true,
        silent: true
    });
};

var buildPopUps = function(popupPath, popArr) {
    for (var p = 0; p < popArr.length; p++) {
        var popup = popArr[p];
        createPopup(popup.contentFilename, popup.ID, popupPath);
    }
};

var createPopup = function(popupFilename, popupId, popupPath) {
    var fileName = popupFilename + '.html',
        filePath = path.join(popupPath, fileName),
        popupTemplate = path.join(config.repoPath, templatePath, 'popup.html');

    fs.copySync(popupTemplate, filePath);
    replace({
        regex: '##ID##',
        replacement: popupId,
        paths: [filePath],
        recursive: true,
        silent: true
    });
};

/**
 * Delete instance
 * @param {object} newConfig input parameters
 */
var deleteInstance = function(newConfig) {
    config = merge(config, newConfig);
    try {
        var thisCustomPath = path.join(config.repoPath, customPath);

        deleteDir(path.join(thisCustomPath, 'html', config.instance));
        deleteDir(path.join(thisCustomPath, 'scripts', config.instance));
        deleteDir(path.join(thisCustomPath, 'styles', config.instance));

        log('Instance deleted');
    } catch (e) {
        throw e;
    }
};

var deleteDirSync = function(p) {
    try {
        rimraf.sync(p);
    } catch (e) {
        throw e;
    }
};

var writeFileSync = function(p, fileName) {
    try {
        var filePath = path.join(p, fileName);
        fs.writeFileSync(filePath, '');
    } catch (e) {
        throw e;
    }
};

var deleteDir = function(d) {
    rimraf(d, function(err) {
        if (err) log(err);
    });
};

var log = function(msg) {
    console.log(msg);
};

module.exports = {
	deleteInstance:deleteInstance,
	buildFromPageStructure:buildFromPageStructure,
	manualBuild:manualBuild
};
