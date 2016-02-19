var fs = require('fs');
var path = require('path');
var prompt = require('prompt');

var parseParams = (argv, callback) => {
  callback = callback || () => {};
  var params = {
    port: 22,
    username: process.env.USER
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
      params.username = m2[1];
      params.host = m2[2];
    } else {
      params.host = m[1];
    }
  }

  if (typeof params.dstPath === 'undefined' ||
      typeof params.host === 'undefined') {
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
    var privKeyPath = path.join(process.env.HOME, '.ssh', 'id_rsaaaa');
    try {
      params.privKey = fs.readFileSync(privKeyPath).toString();
    } catch(e) {
      console.log('need password!!');
      // var schema = {
      //   properties: {
      //     password: {
      //       hidden: true
      //     }
      //   }
      // };
      // prompt.get(schema, (err, result) => {
      //   // if (err) {return console.log(err);}
      //   // if (result.password === result.again) {
      //   //   pwUtils.generate(result.password, (err, hash) => {
      //   //     if (err) {return console.log(err);}
      //   //     console.log(hash);
      //   //   });
      //   // } else {
      //   //   console.log('ERROR: Passwords did not match.');
      //   // }
      // });
      process.exit();
    }

    process.nextTick(() => {
      callback(null, params);
    });
  });
};

module.exports = parseParams;
