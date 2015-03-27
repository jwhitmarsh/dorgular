/**
 * Engine Extractor Library
 * Copyright (c) Abacus International 2014
 */

var assert = require('assert');
var cheerio = require('cheerio'); // HTML mangler, jQuery like syntax
var fs = require('fs-extra'); // filesystem library
var S = require('string'); //string manipulation library
var beautify_html = require('js-beautify').html;
var beautify = require('js-beautify').js_beautify;
var jf = require('jsonfile'); // read/write json files
var util = require('util'); // utilities
var scriptTags = require('script-tags'); // read script tags into objects
var UglifyJS = require("uglify-js");
var execjs = require('./execjs'); // load & parse JS into sandbox.
var DU = require('./utils'); // dora utils library
var merge = require('merge');
var path = require('path');
var HtmlEntities = require('html-entities').AllHtmlEntities;
var entities = new HtmlEntities();
var config = {
    instanceName: 'default',
    outputMathFunctions: true, // boolean, if false, mathFunctions.js will *NOT* be updated.
    language: 'en',
    repoPath: null, // path to top of repo
    engineFile: null // path to engine
};
var converter = {
    version: '5',
    client: ''
};

var $ = null; // html data as loaded by cheerio
var targetScripts = []; // array of script objects extracted from engine
var engineTemplate = path.join(__dirname + '/../templates/engine.js');
var mathFunctions = '$REPO/app/assets/custom/scripts/$INSTANCE/mathFunctions.js';
var outputEngine = '$REPO/app/assets/custom/scripts/$INSTANCE/engine.js';

/**
 * Extract JavaScripts from HTML, cache for later manipluation.
 *
 * For version h5.x of Spreadsheet Converter
 * @param {object} data HTML file.
 */
function _extractScriptsV5(data) {
    var i = 0,
        len = 0;
    //'script-tags' gives us:
    //{
    //attrs:{src:'', lang:''},
    //html:''
    //}
    var allScripts = scriptTags(data);
    var script = null;

    for (i, len = allScripts.length; i < len; i++) {
        script = allScripts[i];

		if (script.attrs !== undefined && script.attrs.src !== undefined && script.attrs.src === 'support/internalfunctions.js') {
            var j = i + 2, // skip this and the next scripts, we want the array, globals, recalc and math functions
                jlen = j + 4;
            for (j, jlen; j < jlen; j++) {
                targetScripts.push({id:'', content:entities.decode(allScripts[j].html)});
            }
            break;
        }
    }

    for (i = 0, len = targetScripts.length; i < len; i++) {
        script = targetScripts[i];
        switch (i) {
            case 0:
                script.id = 'inputs';
                break;
            case 1:
                script.id = 'globals';
                break;
            case 2:
                script.id = 'recalc_onclick';
                break;
            case 3:
                script.id = 'mathFunctions';
                break;
            default:
                break;
        }
        //console.log(script);
    }
}

/**
 * Extract JavaScripts from HTML, cache for later manipulation.
 *
 * For version 6.x of Spreadsheet Converter
 * @param {object} data HTML file.
 */
function _extractScriptsV6(data) {
    var i = 0,
        len = 0;
    //'script-tags' gives us:
    //{
    //attr:'',
    //html:'',
    //}
    var allScripts = entities.decode(scriptTags(data)[2].html);
    //console.log(allScripts);
    var script = null;

    //console.log('allScripts:'+allScripts.content);

    var rc1 = allScripts.indexOf("var co");
    var rc2 = allScripts.indexOf("var arr");
    var rc2a = allScripts.indexOf("function postcode", rc2);
    var rc3 = allScripts.indexOf("var eeisus");
    var rc4 = allScripts.indexOf("var jsonLocal");
    var rc5 = allScripts.indexOf(";", rc4);
    var rc6 = allScripts.indexOf("function submitClick");

    script = allScripts.substring(rc1, rc2);
    targetScripts.push({
        id: 'recalc_onclick',
        src: '',
        content: script
    });

    script = allScripts.substring(rc2, rc2a);
    targetScripts.push({
        id: 'inputs',
        src: '',
        content: script
    });

    script = allScripts.substring(rc3, rc5);
    targetScripts.push({
        id: 'globals',
        src: '',
        content: script
    });

    script = allScripts.substring(rc5, rc6);
    targetScripts.push({
        id: 'mathFunctions',
        src: '',
        content: script
    });
}

/**
 * Extract JavaScripts from HTML, cache for later manipulation.
 *
 * Upto version 7.8.x of Spreadsheet Converter
 * @param {object} data HTML file.
 */
function _extractScriptsV7(data) {
    var i = 0,
        len = 0;
    //'script-tags' gives us:
    //{
    //id:'',
    //src:'',
    //content:''
    //}
    var allScripts = scriptTags(data);
    var markers = {};

    var script = null,
        _scripts = null;

    //find the scripts that count...
    //	i = allScripts.length1;
    for (i; i < allScripts.length; i++) {
        //console.log('-------------------------\nallScripts['+i+']:'+allScripts[i].content);
        if (allScripts[i].content.indexOf("function recalc_onclick(") !== -1) {
            _scripts = allScripts[i].content;
            break;
        }

    }
    //console.log('############################\n'+_scripts+'\n##################################');

    // set up markers
    markers.rc1 = _scripts.indexOf("function recalc_onclick");
    markers.rc2 = _scripts.indexOf("var arr");
    markers.rc2a = _scripts.indexOf("function postcode", markers.rc2);
    markers.rc3 = _scripts.indexOf("var eeisus");
    //markers.rc4 = allScripts.indexOf("var jsonLocal");
    markers.rc5 = _scripts.indexOf("function", markers.rc3);
    markers.rc6 = _scripts.indexOf("function submitClick");

    //console.log(markers);

    for (i in markers) {
        if (markers[i] == -1) {
            console.error('Invalid marker [' + i + '] in _extractV7');
        }
    }

    if (markers.rc2 !== -1) {
        script = _scripts.substring(markers.rc1, markers.rc2);
    } else {
        script = _scripts.substring(markers.rc1, markers.rc2a);
    }
    //console.log('============================');
    targetScripts.push({
        id: 'recalc_onclick',
        src: '',
        content: script
    });

    if (markers.rc2 !== -1) {
        script = _scripts.substring(markers.rc2, markers.rc2a);
    } else {
        script = '// no input arrays in model'; //_scripts.substring(markers.rc2a, markers.rc2a);
    }
    targetScripts.push({
        id: 'inputs',
        src: '',
        content: script
    });

    script = _scripts.substring(markers.rc3, markers.rc5);
    targetScripts.push({
        id: 'globals',
        src: '',
        content: script
    });

    script = _scripts.substring(markers.rc5, markers.rc6);
    targetScripts.push({
        id: 'mathFunctions',
        src: '',
        content: script
    });
}

/**
 * Inject scripts into engine template, save as `engine.js`
 * @param {string} target location to save script to.
 */
function injectScripts(target) {
    var i = 0,
        len = 0,
        script = null,
        regex = null,
        engine = fs.readFileSync(engineTemplate, 'utf8');

    // read in engine template, this will be modified with our new data.

    // loop over target scripts, inject them into the respective locations.
    for (i, len = targetScripts.length; i < len; i++) {
        script = targetScripts[i];

        switch (script.id) {
            case 'inputs':

                regex = /new Array\(\)/g;
                script.content = script.content.replace(regex, '[]');

                regex = /new Array\(([\d]*)\)/g;
                script.content = script.content.replace(regex, '_createArray($1)');

                regex = /new Array\(([\[\s\d\w\,\]]+)\)/g;
                script.content = script.content.replace(regex, '[$1]');

                script.content = script.content.replace(/var ii=0/g, 'ii=0');
                script.content = script.content.replace(/var jj=0/g, 'jj=0');
                script.content = 'var jj=0,ii=0;' + script.content;
                script.content = script.content.replace(/coltmp/g, 'arrCol');
                script.content = script.content.replace(/\,c([\d\w]*)=/g, '; var c$1=');
                script.content = script.content.replace(/\,sumc([\d\w\_]*)=/g, '; var sumc$1=');
                script.content = script.content.replace(/\,tmp([\d]*)=/g, '; var tmp$1=');

                // script.content = script.content.replace(/var c([\d\w]*)/g, "cObj\['c$1'\]");
                // look for `sum`
                script.content = script.content.replace(/var sumc/g, "sumc");
                script.content = script.content.replace(/var tmp/g, "tmp");
                // script.content = script.content.replace(/c([\d\w]*)/g, "cObj\['c$1'\]");
                script.content = script.content.replace(/sumc([\d\w\_]*)/g, "sumObj\['sumc$1'\]");
                script.content = script.content.replace(/tmp([\d]*)/g, "tmpObj\['tmp$1'\]");
                script.content = script.content.replace('function calc(data){', 'function calc(data){var tmpObj={}; var cObj={}; var sumObj={};');
                script.content = script.content.replace(/;};/g, ';cObj = null;tmpObj = null;sumObj = null;}');

                engine = engine.replace('\/\/##INPUTS##', script.content);

                break;
            case 'globals':
                regex = /"£"/g;
                script.content = script.content.replace(regex, "'[$]' ");
                engine = engine.replace('\/\/##GLOBALS##', script.content);
                if (converter.version === '5') {
                    var a = engine.indexOf(',jsonLocal');
                    var b = engine.indexOf(';', a);
                    var c = engine.slice(a, b);
                    engine = engine.replace(c, ';');
                }

                break;
            case 'recalc_onclick':
                switch (converter.version) {
                    case '7':
                    case '6':
                        script.content = script.content.replace('function recalc_onclick(ctl) {', 'function recalc_onclick(caller, noHooks) {var co = {}; if(!noHooks){console.time("recalc "+caller);$(app.model).trigger("beforeModelRecalc", caller);}');
                        script.content = script.content.replace('if (true) {', '');
                        script.content = script.content.replace('};};', 'if(!noHooks){$(app.model).trigger("afterModelRecalc", caller);console.timeEnd("recalc "+caller);}co = null;}');

                        // handle setEngine
                        // regex tests:
                        //console.log(regex.test("document.getElementById('xlew_5_8_5').value=eedatefmt(fmtdate1,co['xlew_5_8_5']);"));
                        regex = /[\s]*document\.getElementById\(\'(XLEW_[0-9_]*)\'\)\.value[\s]*=[\s]*([a-zA-Z0-9\[\]\'\(\)\.\,\_\ \:\?]*)/g;
                        script.content = script.content.replace(regex, 'setEngineValue("$1", $2)');

                        // handle getEngine
                        // regex tests:
                        //console.log(regex.test("co.XLEW_23_24_11 = eeparseFloat(document.formc.XLEW_23_24_11.value);"));
                        //console.log(regex.test("co.XLEW_31_1_2 = document.formc.XLEW_31_1_2.value;"));
                        regex = /document\.getElementById\(\'(XLEW_[0-9_]*)\'\)\.value/g;
                        script.content = script.content.replace(regex, 'getEngineValue("$1").value');

                        // regex tests:
                        //console.log(regex.test("co.XLEW_23_24_11 = eeparseFloat(document.formc.XLEW_23_24_11.value);"));
                        //console.log(regex.test("co.XLEW_31_1_2 = document.formc.XLEW_31_1_2.value;"));
                        regex = /document\.getElementById\(\'(XLEW_[0-9_]*)\'\)\.checked/g;
                        script.content = script.content.replace(regex, 'getEngineValue("$1").checked');

                        regex = /new Array\(\)/g;
                        script.content = script.content.replace(regex, '[]');

                        regex = /new Array\(([\d]*)\)/g;
                        script.content = script.content.replace(regex, '_createArray($1)');

                        regex = /new Array\(([\[\s\d\w\,\]]+)\)/g;
                        script.content = script.content.replace(regex, '[$1]');

                        break;
                    case '5':
                        script.content = script.content.replace('var co = new Object;', '');
                        script.content = script.content.replace('function recalc_onclick(){', 'function recalc_onclick(caller, noHooks) {var co = {}; if(!noHooks){console.time("recalc "+caller);$(app.model).trigger("beforeModelRecalc", caller);}');
                        script.content = script.content.replace('if(true){', '');
                        script.content = script.content.replace('}}', ';if(!noHooks){$(app.model).trigger("afterModelRecalc", caller);console.timeEnd("recalc "+caller);}co = null;}');

                        // handle setEngine
                        // regex tests:
                        //console.log(regex.test("document.formc.XLEW_5_1_2.value = co.XLEW_5_1_2;"));
                        //console.log(regex.test("document.fomc.XLEW_5_1_2.value = co.XLEW_5_1_2;"));
                        regex = /[\s]*document\.formc\.(XLEW_[0-9_]*)\.value[\s]*=[\s]*([a-zA-Z0-9\(\)\.\,\_\ \:\?]*)/g;
                        script.content = script.content.replace(regex, 'setEngineValue("$1", $2)');

                        // handle getEngine
                        // regex tests:
                        //console.log(regex.test("co.XLEW_23_24_11 = eeparseFloat(document.formc.XLEW_23_24_11.value);"));
                        //console.log(regex.test("co.XLEW_31_1_2 = document.formc.XLEW_31_1_2.value;"));
                        regex = /document\.formc\.(XLEW_[0-9_]*)\.value/g;
                        script.content = script.content.replace(regex, 'getEngineValue("$1").value');

                        regex = /new Array\(\)/g;
                        script.content = script.content.replace(regex, '[]');

                        regex = /new Array\(([\d]*)\)/g;
                        script.content = script.content.replace(regex, '_createArray($1)');

                        regex = /new Array\(([\[\s\d\w\,\]]+)\)/g;
                        script.content = script.content.replace(regex, '[$1]');

                        break;
                    default:
                        console.error('bad converter version:' + converter.version);
                        break;
                }

                engine = engine.replace('\/\/##RECALC_ONCLICK##', script.content);
                break;
            default:
                break;
        }
    }

    regex = /new Array\(([\d]*)\)/g;
    engine = engine.replace(regex, '_createArray($1)');

    regex = /new Array\(([\[\s\d\w\,\]]+)\)/g;
    engine = engine.replace(regex, '[$1]');

    // insert name of engine source file.
    engine = engine.replace('##EXTRACT##', config.engineFile);

    // insert modification date
    var now = new Date();
    engine = engine.replace('##DATETIME##', now);

    // set xl_client
    engine = engine.replace('##XL_CLIENT##', converter.client);

    // beautify and write out to target file.
    fs.writeFileSync(target, beautify(engine));
}

/**
 * Meta-function to call correct version of extractScripts.
 * @param {Object} data object to convert
 */
function extractScripts(data) {
    switch (converter.version) {
        case '6':
            _extractScriptsV6(data);
            break;
        case '7':
            _extractScriptsV7(data);
            break;
        case '5':
            _extractScriptsV5(data);
            break;
        default:
            console.error('extractScripts: invalid converter.version: ' + converter);
            break;
    }
}

/**
 * Update template mathFunctions
 */
function updateMathFunctions() {
    // read in existing template mathFunctions as object
    var key = null;
    var currentMF = {},
        newMF = {};
    var file = null;
    var isDirty = false;
    /*
	var target = 'assets/template/scripts/mathFunctions-v'+converter+'.js';
	try {
		fs.statSync(target +'-v'+converter+'.js');
		console.log(file);
	}catch (e) {
		// no file of that version, use default
		target = 'assets/template/scripts/mathFunctions.js';
	}
	*/

    /*
	if (!fs.existsSync(mathFunctions)) {
		fs.copySync(mathTemplate, mathFunctions);
	}
	*/

    //mathFunctions may not exist, so we should 'ensure' it does.
    fs.ensureFileSync(mathFunctions);

    // load mathFunctions into a sandbox VM.
    execjs.fromFile(mathFunctions, currentMF);

    // convert 'new' mathFunctions to object
    newMF = {};
    for (key in targetScripts) {
        if (targetScripts[key].id === 'mathFunctions') {
            execjs.fromString(targetScripts[key].content, newMF);
            break;
        }
    }

    // check if functions/vars in newMF exist in currentMF, if not, add and flag as dirty
    for (key in newMF) {
        if (!currentMF[key] || currentMF[key] === undefined) {
            console.log('currentMF missing %s', key);
            currentMF[key] = newMF[key];
            isDirty = true;
        }
    }

    // write out mathFunctions, overwrite old file, but only if dirty
    if (isDirty) {
        var targetMF = '';
        var chunk = null;
        for (key in currentMF) {
            // handle `vars` differently;
            chunk = '' + currentMF[key];
            var fw = chunk.substr(0, chunk.indexOf(' '));
            if (fw === 'function') {
                targetMF += chunk;
            } else {
                targetMF += 'var ' + key + ' = ' + chunk + ';';
            }
        }
        targetMF = beautify(targetMF);
        fs.writeFileSync(mathFunctions, targetMF);

        console.log('Updated mathFunctions written out.');
        //		fs.writeFileSync('assets/template/scripts/mathFunctions-v'+converter+'.js', targetMF);
    }
}

/**
 * Main script runner
 * @param err error message
 * @param {string} data HTML file as string
 */
function run(err, data) {
    // check we have engine data
    if (!data || data === undefined) {
        console.error("Failed to load [%s]. Typo in file name or path?", config.engineFile);
        process.exit(-1);
    }

    var i = 0,
        len = 0,
        allowedConverters = ['5', '6', '7'];
    //console.log(outputEngine, config.instanceName);
    var target = DU.replacePathMarker(outputEngine, config); //outputEngine.replace('$INSTANCE', config.instanceName);//'app/assets/custom/scripts/' + instanceName + '/engine.js';
    mathFunctions = DU.replacePathMarker(mathFunctions, config); //.replace('$INSTANCE', config.instanceName);
    console.log('Engine: ' + config.engineFile);
    console.log('Model: ' + config.instanceName);
    console.log('Language: ' + config.language);
    console.log('Output: ' + target);

    // fix case of input identifiers as uppercase
    data = S(data).replaceAll('xlew_', 'XLEW_').s;

    $ = cheerio.load('' + data + '');

    if ($.html() === "undefined") {
        console.error("Failed to load into cheerio [%s]. Typo in file name or path?", config.engineFile);
        process.exit(-3);
    }
    // get spreadsheet converter version
    converter.client = $('#xl_client').val();

    // parse client as verion, should in format of x6.10.5544.0. NB first character my be an 'h' for version 5
    converter.version = converter.client.substring(1, converter.client.indexOf("."));
    console.log('Converter: ' + converter.client);
    console.log('');

    // check if converter version is correct
    if (allowedConverters.indexOf(converter.version) === -1) {
        console.error('Bad converter version! Allowed versions:' + allowedConverters);
        process.exit(-1);
    }

    // funcs go here
    extractScripts(data);
    injectScripts(target);
    console.log(config.outputMathFunctions);
    if (config.outputMathFunctions) {
        updateMathFunctions();
    } else {
        console.log('Not updated mathFunctions');
    }

    console.log('Extraction completed to: %s\nCheck the app still works and then check in the new engine', target);
}


exports.extract = function(newConfig) {
    config = merge(config, newConfig);
    //console.log(config);
    fs.readFile(config.engineFile, 'utf8', run);
};
