var fs = require('fs');

var utils = {};

utils.uploadFile = (sftp, src, dst, callback) => {
	callback = callback || () => {};

    sftp.fastPut(src, dst, {
        localFile: src,
        step: (total_transferred, chunk, total, option) => {
            //console.log('Uploading file ( ' + src + ' )... ' + total_transferred/total);
        }
    }, (err) => {
        if (err) {return callback(err);}
		fs.stat(src, (err, stat) => {
			if (err) {return callback(err);}
			sftp.chmod(dst, stat.mode, (err) => {
				if (err) {return callback(err);}
				return callback();
			});
		});
    });
};

module.exports = utils;
