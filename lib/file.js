'use strict';

class File {
  constructor(path) {
    this.type = 'file';
    this._path = path;
  }
}

module.exports = File;
