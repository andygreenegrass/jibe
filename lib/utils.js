var fs = require('fs');

var utils = {};

utils.uploadFile = function (sftp, src, dst, callback) {
	callback = callback || function() {};

    sftp.fastPut(src, dst, {
        localFile: src,
        step: function(total_transferred, chunk, total, option) {
            //console.log('Uploading file ( ' + src + ' )... ' + total_transferred/total);
        }
    }, function (err) {
        if (err) {return callback(err);}
		fs.stat(src, function(err, stat) {
			if (err) {return callback(err);}
			sftp.chmod(dst, stat.mode, function(err) {
				if (err) {return callback(err);}
				return callback();
			});
		});
    });
};

module.exports = utils;
