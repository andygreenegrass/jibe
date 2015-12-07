var fs = require('fs');
var path = require('path');
var glob = require('glob');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var File = require('./file');

var Directory = function(_path, parent) {
    EventEmitter.call(this);
    var self = this;
    this.type = 'directory';
    this._path = _path;
    this._ignore = null;
    this._parent = parent || null;

    this.all = {};

    this.fsw = fs.watch(_path, {persistent: true});
	this.fsw.on('change', function(event, filename) {
        self._onChange(event, filename);
    });

	this.fsw.on('error', function(error) {
		console.log('error: ' + error);
	});
};

util.inherits(Directory, EventEmitter);

//------------------------------------------------------------------------------

Directory.prototype._onChange = function(event, filename) {
    var self = this;

    var filePath = path.join(self._path, filename);
    var obj = self.all[filePath];
    if (event === 'change') {
        // make sure we care...
        if (typeof obj !== 'undefined' && obj !== null) {
            self.emit('change', {
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
            fs.stat(filePath, function(err, stat) {
                if (err) {return;}
                self.all[filePath] = null;
                self.isIgnored(filePath, function(err, value) {
                    if (err) {return console.log(err);}
                    if (stat.isDirectory()) {
                        // directory
                        self._addDirectory(filePath);
                    } else if (stat.isFile()) {
                        // file
                        self._addFile(filePath);
                    }
                });
            });
        } else {
            // deleted
            delete self.all[filePath];
            if (obj !== null) {
                self.emit('change', {
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
    var self = this;
    callback = callback || function() {};
    self._ignore = [];
    fs.readFile(path.join(self._path, '.gitignore'), function (err, data) {
        if (data) {
			var patterns = data.toString().split('\n');
			patterns.forEach(function(p) {
				var tmp = p.trim();
				var base = self._path;
				if (!p.match(/^\//)) {base = path.join(base, '**');}
				if (tmp.length) {self._ignore.push(path.join(base, p.trim()));}
			});
		}
        return callback();
    });
};

//------------------------------------------------------------------------------

Directory.prototype._scan = function(callback) {
    var self = this;

    var pattern = path.join(self._path, '*');
    glob(pattern, {
        dot: true,
        ignore: self._ignore,
        mark: true
    }, function(err, files) {
        if (err) {return callback(err);}
        //console.log(files);
        async.each(files, function(file, cb) {
            var _path = file.replace(/\/$/, '');
            self.all[_path] = null;
            if (self._parent) {
                self._parent.isIgnored(file, function(err, value) {
                    if (value === false) {
                        return self._addFile(file, cb);
                    }
                    return cb();
                });
            } else {
                return self._addFile(file, cb);
            }
        }, function(err) {
            callback(err);
        });
    });
};

//------------------------------------------------------------------------------

Directory.prototype.isIgnored = function(file, callback) {
    var self = this;
    callback = callback || function() {};

    var next = function() {
        if (self._parent) {
            return self._parent.isIgnored(file, callback);
        } else {
            return callback(null, false);
        }
    };

    if (self._ignore.length === 0) {
        return next();
    }

    glob(file, {
        dot: true,
        ignore: self._ignore,
        mark: true
    }, function(err, files) {
        if (err) {return callback(err);}
        if (files.length === 0) {
            return callback(null, true);
        }

        return next();
    });
};

//------------------------------------------------------------------------------

Directory.prototype.scan = function(callback) {
    var self = this;
    callback = callback || function() {};

    if (!self._ignore) {
        self._buildIgnore(function() {
            self._scan(callback);
        });
    } else {
        self._scan(callback);
    }
};

//------------------------------------------------------------------------------

Directory.prototype._addDirectory = function(_path, callback) {
    var self = this;
    callback = callback || function() {};

    // directory
    _path = _path.replace(/\/$/, '');
	var dir = new Directory(_path, self);
    dir.on('change', function(event) {
        self.emit('change', event);
    });
    self.all[_path] = dir;
    self.emit('change', {
        type: 'new',
        file: {
            path: _path,
            type: 'directory'
        }
    });
    dir.scan(callback);
};

Directory.prototype._addFile = function(_path, callback) {
    var self = this;
    callback = callback || function() {};

	if (_path.match(/\/$/)) {
        // directory
        self._addDirectory(_path, callback);
	} else {
        var file = new File(_path);
        self.all[_path] = file;
        self.emit('change', {
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
    var self = this;
    callback = callback || function() {};
    self.fsw.close();
    async.each(self.directories, function(dir, cb) {
        dir.unwatch(cb);
    }, function(err) {
        callback(err);
    });
};

Directory.prototype._get = function(type, callback) {
    var self = this;
    var dirs = [];
    var results = [];
    for (var key in self.all) {
        var file = self.all[key];
        if (file !== null) {
            if (file.type === 'directory') {
                dirs.push(file);
            }
            if (file.type === type) {
                results.push(file._path);
            }
        }
    }

    async.each(dirs, function(dir, cb) {
        dir._get(type, function(err, dirs) {
            results = results.concat(dirs);
            cb();
        });
    }, function(err) {
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
