var fs = require('fs');
var path = require('path');
var prompt = require('prompt');

var parseParams = (argv, callback) => {
  callback = callback || () => {};
  var params = {
    port: 22,
    ssh: {
      username: process.env.USER
    }
  };

  var error = () => {
    process.nextTick(() => {
      callback('Usage: jibe {srcDir} {user}@{host}:{dstDir}');
    });
  };

  if (argv.length !== 4) {return error();}

  params.srcPath = argv[2];
  params.srcPathAbs = path.resolve(params.srcPath);
  params.srcDirName = path.basename(params.srcPathAbs);

  var tmp = process.argv[3];
  var m = tmp.match(/(.*?):(.*)/);
  if (m) {
    params.dstPath = m[2];
    var m2 = m[1].match(/(.*?)@(.*)/);
    if (m2) {
      params.ssh.username = m2[1];
      params.ssh.host = m2[2];
    } else {
      params.ssh.host = m[1];
    }
  }

  if (typeof params.dstPath === 'undefined' ||
      typeof params.ssh.host === 'undefined') {
    return error();
  }

  // ensure that source is a Directory
  fs.lstat(params.srcPath, (err, stats) => {
    if (err) {return error();}
    if (!stats.isDirectory()) {return error();}

    if (params.dstPath.match(/\/$/)) {
      // no rename
      params.dstPath += params.srcDirName;
    }

    // for now assume home is where we start
    params.dstPath = params.dstPath.replace(/^~/, '.');

    // TODO
    // var privKeyPath = path.join(process.env.HOME, '.ssh', 'id_rsa');
    // try {
    //   params.ssh.privateKey = fs.readFileSync(privKeyPath).toString();
    // } catch(e) {
    //   return prompt.get({
    //     properties: {
    //       password: {
    //         hidden: true,
    //         required: true
    //       }
    //     }
    //   }, (err, result) => {
    //     if (err) {return error();}
    //     params.ssh.password = result.password;
    //     callback(null, params);
    //   });
    // }

    prompt.message = '';

    return prompt.get({
      properties: {
        password: {
          hidden: true,
          required: true
        }
      }
    }, (err, result) => {
      if (err) {return error();}
      params.ssh.password = result.password;
      callback(null, params);
    });
  });
};

module.exports = parseParams;
