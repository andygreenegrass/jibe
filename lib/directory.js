'use strict';

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var File = require('./file');

var Directory = function(_path, parent) {
  EventEmitter.call(this);
  this.type = 'directory';
  this._path = _path;
  this._ignore = null;
  this._parent = parent || null;

  this.all = {};

  this.fsw = fs.watch(_path, {persistent: true});
  this.fsw.on('change', (event, filename) => {
    this._onChange(event, filename);
  });

  this.fsw.on('error', (error) => {
    console.log('error: ' + error);
  });
};

util.inherits(Directory, EventEmitter);

//------------------------------------------------------------------------------

Directory.prototype._onChange = function(event, filename) {
  var filePath = path.join(this._path, filename);
  var obj = this.all[filePath];
  if (event === 'change') {
    // make sure we care...
    if (typeof obj !== 'undefined' && obj !== null) {
      this.emit('change', {
        type: 'modified',
        file: {
          path: filePath,
          type: 'file'
        }
      });
    }
  } else if (event === 'rename') {
    // new, deleted, or moved file or Directory
    if (typeof obj === 'undefined') {
      // new
      fs.stat(filePath, (err, stat) => {
        if (err) {return;}
        this.all[filePath] = null;
        this.isIgnored(filePath, (err, value) => {
          if (err) {return console.log(err);}
          if (stat.isDirectory()) {
            // directory
            this._addDirectory(filePath);
          } else if (stat.isFile()) {
            // file
            this._addFile(filePath);
          }
        });
      });
    } else {
      // deleted
      delete this.all[filePath];
      if (obj !== null) {
        this.emit('change', {
          type: 'deleted',
          file: {
            path: filePath,
            type: 'file'
          }
        });
      }
    }
  }
};

//------------------------------------------------------------------------------

Directory.prototype._buildIgnore = function(callback) {
  callback = callback || () => {};
  this._ignore = [];
  fs.readFile(path.join(this._path, '.gitignore'), (err, data) => {
    if (data) {
      var patterns = data.toString().split('\n');
      patterns.forEach((p) => {
        var tmp = p.trim();
        var base = this._path;
        if (!p.match(/^\//)) {base = path.join(base, '**');}
        if (tmp.length) {this._ignore.push(path.join(base, p.trim()));}
      });
    }
    return callback();
  });
};

//------------------------------------------------------------------------------

Directory.prototype._scan = function(callback) {
  var pattern = path.join(this._path, '*');
  glob(pattern, {
    dot: true,
    ignore: this._ignore,
    mark: true
  }, (err, files) => {
    if (err) {return callback(err);}
    //console.log(files);
    async.each(files, (file, cb) => {
      var _path = file.replace(/\/$/, '');
      this.all[_path] = null;
      if (this._parent) {
        this._parent.isIgnored(file, (err, value) => {
          if (value === false) {
            return this._addFile(file, cb);
          }
          return cb();
        });
      } else {
        return this._addFile(file, cb);
      }
    }, (err) => {
      callback(err);
    });
  });
};

//------------------------------------------------------------------------------

Directory.prototype.isIgnored = function(file, callback) {
  callback = callback || () => {};

  var next = () => {
    if (this._parent) {
      return this._parent.isIgnored(file, callback);
    } else {
      return callback(null, false);
    }
  };

  if (this._ignore.length === 0) {
    return next();
  }

  glob(file, {
    dot: true,
    ignore: this._ignore,
    mark: true
  }, (err, files) => {
    if (err) {return callback(err);}
    if (files.length === 0) {
      return callback(null, true);
    }

    return next();
  });
};

//------------------------------------------------------------------------------

Directory.prototype.scan = function(callback) {
  callback = callback || () => {};

  if (!this._ignore) {
    this._buildIgnore(() => {
      this._scan(callback);
    });
  } else {
    this._scan(callback);
  }
};

//------------------------------------------------------------------------------

Directory.prototype._addDirectory = function(_path, callback) {
  callback = callback || () => {};

  // directory
  _path = _path.replace(/\/$/, '');
  var dir = new Directory(_path, this);
  dir.on('change', (event) => {
    this.emit('change', event);
  });
  this.all[_path] = dir;
  this.emit('change', {
    type: 'new',
    file: {
      path: _path,
      type: 'directory'
    }
  });
  dir.scan(callback);
};

Directory.prototype._addFile = function(_path, callback) {
  callback = callback || () => {};

  if (_path.match(/\/$/)) {
    // directory
    this._addDirectory(_path, callback);
  } else {
    var file = new File(_path);
    this.all[_path] = file;
    this.emit('change', {
      type: 'new',
      file: {
        path: _path,
        type: 'file'
      }
    });
    callback();
  }
};

//------------------------------------------------------------------------------

Directory.prototype.unwatch = function(callback) {
  callback = callback || () => {};
  this.fsw.close();
  async.each(this.directories, (dir, cb) => {
    dir.unwatch(cb);
  }, (err) => {
    callback(err);
  });
};

Directory.prototype._get = function(type, callback) {
  var dirs = [];
  var results = [];
  for (let key in this.all) {
    var file = this.all[key];
    if (file !== null) {
      if (file.type === 'directory') {
        dirs.push(file);
      }
      if (file.type === type) {
        results.push(file._path);
      }
    }
  }

  async.each(dirs, (dir, cb) => {
    dir._get(type, (err, dirs) => {
      results = results.concat(dirs);
      cb();
    });
  }, (err) => {
    callback(err, results);
  });
};

Directory.prototype.getDirectories = function(callback) {
  this._get('directory', callback);
};

Directory.prototype.getFiles = function(callback) {
  this._get('file', callback);
};

//------------------------------------------------------------------------------

module.exports = Directory;
