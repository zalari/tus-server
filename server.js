/**
 * Created by chris on 18.06.14.
 */
var http = require("http"),
    events = require("events"),
    fs = require('fs'),
    util = require('util');

var express = require("express"),
    morgan = require("morgan"),
    _ = require('lodash');

var upload = require("./upload");

var CONFIG = require('./config.json');

//Express konfigurieren
var app = express();
//set up morgan for logging
var logger = morgan;
app.use(logger());


//Eventbasierter Server...
var self = new events.EventEmitter();

self.availableEvents = ['ready','upload','uploadComplete'];

self.READY_EVENT = "ready";
self.UPLOAD_EVENT = "upload";
self.UPLOAD_COMPLETE_EVENT = "uploadComplete";

//Default-Config
self.config = {
    "port":5000,
    "prefixPath":"/upload/",
    "fileUploadPath":"files"
};

var _configure = function(configObj) {
    if (typeof configObj == "object") {
        return _.merge(self.config,configObj);
    }
    else {
        return self.config;
    }

};

var _processHEAD = function(req, res) {
    console.log(req.params.filename," needs to be headed...");
};

var _processPATCH = function(req, res) {
    console.log(req.params.filename," needs to be patched...");
};

/**
 * initialisiert den Server mit sinnvollen Defaults...
 * @param configObj
 */
self.initServer = function(configObj) {
    self.config = _configure(configObj);
    //Verzeichnisse einrichten; falls noch nicht vorhanden
    try {
        fs.mkdirSync(self.config.fileUploadPath);
    }
    catch (error) {
        if ((error != null) && error.code !== "EEXIST") {
            console.error(util.inspect(error));
            process.exit(1);
        }
    }
    //Routen für Express einrichten und Server starten
    //wir müssen HEAD und PATCH-Requests unterstützen; dafür Routen definieren...
    app.patch(self.config.prefixPath+":filename", function(req,res) {
        _processPATCH(req,res);
    });
    app.head(self.config.prefixPath+":filename", function(req,res) {
        _processHEAD(req,res);
    });

    console.log("Starting tus-server on port",self.config.port);
    app.listen(self.config.port);

    return self.emit(self.READY_EVENT);
};


/*app.get(CONFIG.prefixPath+":filename", function(req,res) {
    console.log(req.params.filename," needs to be getted...");
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("GETTING\n");
});*/


module.exports = self;
