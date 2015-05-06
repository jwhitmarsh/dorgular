# Abacus Utilities

## Pre-requisites
This should already be set up, if not, the process is painless. Ask either Mark or Robin for help.
 * [node](http://nodejs.org/)
 * npm
 * following node modules (installed via npm):
  * string
  * cheerio
  * fs-extra
  * js-beautify
  * jsonfile
  * script-tags
  * utils
  * uglify-js
  * posix-getopts

## Toolset
Each tool is written in JavaScript, and is run from the terminal command line.

Notes:
 * Run the tool from the top-level directory of the repo.
 * Pass `--help` to get a usage message for the tool.
 * Pass `--version` to get the versin of the tool you are using.

If you have any problems/suggestions, see the [github issues](https://github.com/dresources/dora/issues
).

Tools:
 * app-generator
 * engine-extractor
 * instance-builder
 * tracking-key-smith
 * fix-report-json
 * language-extractor

### app-generator

Use this to build a flat app, using the default styles, from a converted spreadsheet.

Notes:
 * It will generate new HTML sections, one per spreadsheet page, in the form of a sanitised table.
  * this is an additive process, it will **not** delete any previous content, all new pages are added to the *end* of the app.
 * The engine inputs are stripped down to what the template requires, and the relevant keyboard pattern included.
  * this saves having to copy inputs directly from the converted spreadsheet and retaining unwanted/undesirable attributes.
 * It updates the `structure.json` with the `childElement` details to create a working app.
 * Excel sheets that start with *mf* are considered main flow pages. All others will be converted into popups.
 * NB: The pages will be given an ID that matches the file name/spreadsheet page title by default, if you prefer numeric IDs, e.g. p1, p2 etc., then pass `-n` on the command line.
 * By default, the output is written to `app/assets/custom/html/$INSTANCE/`.
   * For a different named instance, pass `-i <new instance name>` on the command line.
   * For a different language, pass `-l <language>` on the command line.

Example:
```
$> node ~/path/to/dora/bin/app-generator.js --repoPath ~/path/to/appRepo/ --engine ~/path/to/appRepo/not-in-build/tools/spreadsheet/converted/version-00/Example-SCv5.htm
```

### engine-extractor

Use this to drop a new engine into your app, using a converted spreadheet.

Notes:
 * This will update the `app/assets/custom/scripts/$INSTANCE/engine.js`.
 * By default, the output is written to `app/assets/custom/scripts/default`.
  * For a different named instance, pass `-i <new instance name` on the command line.

Example:
```
$> node ~/path/to/dora/bin/engine-extractor.js --repoPath ~/path/to/appRepo/ --engine ~/path/to/appRepo/not-in-build/tools/spreadsheet/converted/version-00/Example-SCv5.htm
```

### fix-report-json

Use this to massage the `Report.json` into the correct format. Fix formatting of exported business case references to match template version.

Example:
```
$> node ~/path/to/dora/bin/fix-report-json.js --repoPath ~/path/to/appRepo/ --reportFile ~/path/to/Report.json
```

### language-extractor

Use this to convert a Unicode csv text export from Excel into the correct format.

Notes:
 * By default, the output is written to `app/assets/custom/data/lanugages`.

Example:
```
$> node ~/path/to/dora/bin/language-extractor.js --repoPath ~/path/to/appRepo/ --csvFile ~/path/to/translated.csv
```

### locksmith

Simple tool for create unique tracking keys.

Example:
```
$> node ~/path/to/dora/locksmith.js
```
