#!/usr/bin/env node

var path = require('path');
var Client = require('ssh2').Client;

var utils = require('./lib/utils');
var Project = require('./lib/project');
var parseParams = require('./lib/params');

//------------------------------------------------------------------------------

function start(params, sftp) {
    console.log('Scanning project...');
    var project = new Project(params.srcPath);
    var dst;

    project.on('change', function(event) {
        if (event.type === 'new' || event.type === 'modified') {
            if (event.file.type === 'directory') {
                dst = params.dstPath + '/' + event.file.path;
                sftp.mkdir(dst, function(err) {
                    if (err && err.code !== 4) {console.log(err);}
                });
            } else {
                console.log(Date.now() + ' uploading ' + event.file.path + '...');
                dst = params.dstPath + '/' + event.file.path;
                utils.uploadFile(sftp, event.file.path, dst, function(err) {
                    if (err) {console.log(err);}
                    console.log(Date.now() + ' uploaded ' + event.file.path);
                });
            }
        }
    });
}

//------------------------------------------------------------------------------

parseParams(process.argv, function(err, params) {
    if (err) {console.log(err); process.exit(1);}
    console.log('Destination: ' + params.dstPath);

    process.chdir(params.srcPathAbs);
    var dstParentDir = path.dirname(params.dstPath);

    console.log('Connecting...');
    var conn = new Client();
    conn.on('ready', function() {
        conn.sftp(function(err, sftp) {
            if (err) {throw err;}
            console.log('Connected.');
            sftp.stat(dstParentDir, function(err, stat) {
                if (err) {console.log(err); process.exit(1);}
                sftp.mkdir(params.dstPath, {}, function(err) {
                    if (err && err.code !== 4) {
                        console.log(err);
                        process.exit(1);
                    }
                    start(params, sftp);
        		});
            });
        });
    });
    conn.connect({
        host: params.host,
        port: params.port,
        username: params.username,
        privateKey: params.privKey
    });
});
