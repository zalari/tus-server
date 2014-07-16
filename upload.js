/**
 * (c) Christian Ulbrich, Zalari UG (haftungsbeschränkt)
 * 2014
 */
var fs = require('fs');

var self = {};

/**
 * returns the offset, i.e. the file size of a file.
 * @param filepath fully qualified path to the file, whose offset should be returned
 */
self.getOffset = function (filepath) {
    //when the file is not existing, simply return an offset of 0...
    //TODO: compensate for io-errors...
    if (fs.existsSync(filepath)) {
        //Größe holen
        var stat = fs.statSync(filepath);
        return stat.size;
    } else {
        return 0
    }
};

self.getWriteStream = function (filepath, start) {
    return fs.createWriteStream(filepath,{"start":start});
};

module.exports = self;
