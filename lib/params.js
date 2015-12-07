var fs = require('fs');
var path = require('path');

var parseParams = function(argv, callback) {
    callback = callback || function() {};
    var params = {
        port: 22,
        username: process.env.USER
    };

    var error = function() {
        process.nextTick(function() {
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
    fs.lstat(params.srcPath, function(err, stats) {
        if (err) {return error();}
        if (!stats.isDirectory()) {return error();}

        if (params.dstPath.match(/\/$/)) {
            // no rename
            params.dstPath += params.srcDirName;
        }

        // for now assume home is where we start
        params.dstPath = params.dstPath.replace(/^~/, '.');

        // TODO
        var privKeyPath = path.join(process.env.HOME, '.ssh', 'id_rsa');
        params.privKey = fs.readFileSync(privKeyPath).toString();

        process.nextTick(function() {
            callback(null, params);
        });
    });
};

module.exports = parseParams;
