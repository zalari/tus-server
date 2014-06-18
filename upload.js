/**
 * Created by chris on 18.06.14.
 */
var fs = require('fs');

var self = {};

/**
 * liefert den Offset, daher die Dateigröße für eine Datei
 * @param filepath Pfad zur Datei für die die Größe geliefert werden soll
 */
self.getOffset = function (filepath) {
    //wenn die Datei nicht vorhanden ist, dann einfach 0 zurück liefern...
    //TODO: IO-Operationen können Fehler erzeugen...
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
