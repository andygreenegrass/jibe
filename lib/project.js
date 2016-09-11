'use strict';

const EventEmitter = require('events');
const Directory = require('./directory');

class Project extends EventEmitter {
  constructor(srcPath) {
    super();
    this._baseDir = new Directory(srcPath, this);
    this._baseDir.on('change', (event) => {
      this.emit('change', event);
    });
    this._baseDir.scan(() => {
      this.emit('ready');
    });
  }

  isIgnored(file, callback) {
    var val = false;
    if (file.match('\.git/$')) {val = true;}
    //if (false && !val) {console.log(file);}
    return callback(null, val);
  }

  getDirectories(callback) {
    this._baseDir.getDirectories(callback);
  }

  getFiles(callback) {
    this._baseDir.getFiles(callback);
  }
}

module.exports = Project;
