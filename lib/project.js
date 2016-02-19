var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Directory = require('./directory');

//------------------------------------------------------------------------------

var project = function(srcPath) {
  EventEmitter.call(this);

  this._baseDir = new Directory(srcPath, this);
  this._baseDir.on('change', (event) => {
    this.emit('change', event);
  });
  this._baseDir.scan(() => {
    this.emit('ready');
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
