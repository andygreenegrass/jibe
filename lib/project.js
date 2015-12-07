var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Directory = require('./directory');

//------------------------------------------------------------------------------

var project = function(srcPath) {
    EventEmitter.call(this);
    var self = this;

    self._baseDir = new Directory(srcPath, this);
    self._baseDir.on('change', function(event) {
        self.emit('change', event);
    });
    self._baseDir.scan(function() {
        self.emit('ready');
    });
};

util.inherits(project, EventEmitter);

//------------------------------------------------------------------------------

project.prototype.isIgnored = function(file, callback) {
	var val = false;
	if (file.match('\.git/$')) {val = true;}
	if (false && !val) {
		console.log(file);
	}
	return callback(null, val);
};

project.prototype.getDirectories = function(callback) {
    this._baseDir.getDirectories(callback);
};

project.prototype.getFiles = function(callback) {
    this._baseDir.getFiles(callback);
};

//------------------------------------------------------------------------------

module.exports = project;
