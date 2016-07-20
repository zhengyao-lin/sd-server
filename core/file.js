/*
	file:js: operations on file
 */

var fs		= require("fs");
var crypto	= require("./crypto.js");
var date	= require("./date.js");
var err		= require("./err.js");

exports.File = function (file, md5) {
	return {
		type: file.headers["content-type"],
		md5: md5,
		path: mapFilePath(md5),
		suffix: getSuffix(file.path)
	};
}

function getSuffix(path) {
	var split = path.split(".");
	return split[split.length - 1];
}

function mapFilePath(md5) {
	return err.upload_dir + "/" + md5;
}

exports.checksum = function (env, path, callback) {
	return fs.readFile(path, err.callback(env, function (dat) {
		var md5 = crypto.md5(dat);
		callback(md5);
	}));
}

// file is the parsed object generated by multiparty
exports.saveUpload = function (env, file, callback) {
	if (!fs.existsSync(err.upload_dir)) {
		fs.mkdirSync(err.upload_dir);
	}

	return exports.checksum(env, file.path, function (md5) {
		var saveto = mapFilePath(md5);
		fs.exists(saveto, function (exists) {
			if (!exists) {
				fs.rename(file.path, saveto,
					err.callback(env, function () {
						callback(exports.File(file, md5));
					})
				);
			} else {
				callback(exports.File(file, md5));
			}
		});
	});
}

exports.types = {
	image: [ "image/jpeg", "image/png" ]
};

exports.checkType = function (file, expects) {
	return expects.indexOf(file.headers["content-type"]) != -1;
}
