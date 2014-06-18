/**
 * Created by chris on 18.06.14.
 */
var http = require("http"),
    events = require("events"),
    fs = require('fs'),
    util = require('util'),
    path = require('path');

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

var ALLOWED_METHODS = ["HEAD", "PATCH"];
var ALLOWED_METHODS_STR = ALLOWED_METHODS.join(' ');

//Default-Config
self.config = {
    "port":5000,
    "prefixPath":"/upload/",
    "fileUploadPath":"files",
    "serverString":"tus-server",
    "logDir": "logs",
    "logRotateSize": 10485760,
    "logLevel": "info",
    "host":"127.0.0.1"

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
    //es gibt keine Authentifizierung und es ist auch egal, ob Dateien da sind, oder nicht
    //dadurch wird jeder HEAD-Request positiv beantwortet; also in der Art und Weise,
    //das immer ein Offset zurück geliefert wird
    //entweder eben 0; sprich die Datei ist nicht vorhanden, oder aber
    //die Länge der Datei
    var filename = req.params.filename;
    var absolutePath = path.resolve(self.config.fileUploadPath,filename);
    var offset = upload.getOffset(absolutePath);
    res.setHeader("Offset",offset);
    res.setHeader("Content-Length",0);
    res.setHeader("Connection","close");
    res.writeHead(200,"OK");
    res.end();
};

var _processPATCH = function(req, res) {
    console.log(req.params.filename," needs to be patched...");
};

var _commonHeaders = function(res) {
    res.setHeader("Server", self.config.server);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS_STR);
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Final-Length, Offset");
    return res.setHeader("Access-Control-Expose-Headers", "Location");
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

    var server = http.createServer(app);
    server.timeout = 30000;
    server.listen(self.config.port);
    return self.emit(self.READY_EVENT);
};


/*app.get(CONFIG.prefixPath+":filename", function(req,res) {
    console.log(req.params.filename," needs to be getted...");
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("GETTING\n");
});*/


module.exports = self;
