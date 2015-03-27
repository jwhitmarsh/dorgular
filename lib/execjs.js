var vm = require('vm'),
	fs = require('fs'),
	execjs = {
		fromFile : function (path, context) {
			var data = fs.readFileSync(path);
			vm.runInNewContext(data, context, path);
		},

		fromString : function (data, context){
			vm.runInNewContext(data, context);
		}
	};

module.exports = execjs;
