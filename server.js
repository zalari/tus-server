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

self.availableEvents = ['ready','upload','uploadComplete','uploadAborted'];

self.READY_EVENT = "ready";
self.UPLOAD_EVENT = "upload";
self.UPLOAD_COMPLETE_EVENT = "uploadComplete";
self.UPLOAD_ABORTED = "uploadAborted";

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

var _httpStatus = function(res, statusCode, reason, body) {
    if (body == null) {
        body = '';
    }
    res.writeHead(statusCode, reason);
    return res.end(body);
};

var _processHEAD = function(req, res) {
    //TODO: richtiges Debug à la Winston ergänzen...
    //console.log(req.params.filename," needs to be headed...");
    //es gibt keine Authentifizierung und es ist auch egal, ob Dateien da sind, oder nicht
    //dadurch wird jeder HEAD-Request positiv beantwortet; also in der Art und Weise,
    //das immer ein Offset zurück geliefert wird
    //entweder eben 0; sprich die Datei ist nicht vorhanden, oder aber
    //die Länge der Datei
    var filename = req.params.filename;
    var absolutePath = path.resolve(self.config.fileUploadPath,filename);
    var offset = upload.getOffset(absolutePath);
    res.setHeader("Offset",offset);
    res.setHeader("Connection","close");
    return _httpStatus(res,200,"OK");
};

var _processPATCH = function(req, res) {
    //TODO: richtiges logging / Debugging z.B. à la Winston
    //console.log(req.params.filename," needs to be patched...");
    //Fehlerfälle abfangen
    //TODO: dafür gibt es doch bestimmt eine schicke Middleware...
    if (req.headers["content-type"] == null) {
        return _httpStatus(res, 400, "Content-Type Required");
    }
    if (req.headers["content-type"] !== "application/offset+octet-stream") {
        return _httpStatus(res, 400, "Content-Type Invalid");
    }
    if (req.headers["offset"] == null) {
        return _httpStatus(res, 400, "Offset Required");
    }
    var offsetIn = parseInt(req.headers["offset"]);

    if (isNaN(offsetIn || offsetIn < 0)) {
        return _httpStatus(res, 400, "Offset Invalid");
    }

    if (req.headers["content-length"] == null) {
        return _httpStatus(res, 400, "Content-Length Required");
    }

    var contentLength = parseInt(req.headers["content-length"]);
    if (isNaN(contentLength || contentLength < 1)) {
        return _httpStatus(res, 400, "Invalid Content-Length");
    }

    //Dateiname bauen
    var filename = req.params.filename;
    //TODO:so absolut ist der Pfad gar nicht unbedingt :)
    var absolutePath = path.resolve(self.config.fileUploadPath,filename);

    //jetzt kann der Upload beginnen...
    try {
        var writeSteam = upload.getWriteStream(absolutePath,offsetIn);
        if (writeSteam == null)
            throw new Error('invalid-write-stream');
    }
    catch (error) {
        //TODO:implement me...
        console.log('error beim Datei erstellen...',error);
    }
    req.pipe(writeSteam);
    //jetzt hat ein Upload gestartet...
    self.emit(self.UPLOAD_EVENT,filename);
    /*req.on("data", function(buffer) {
        winston.debug("old Offset " + info.offset);
        info.bytesReceived += buffer.length;
        info.offset += buffer.length;
        winston.debug("new Offset " + info.offset);
        if (info.offset > info.finalLength) {
            return httpStatus(res, 500, "Exceeded Final-Length");
        }
        if (info.received > contentLength) {
            return httpStatus(res, 500, "Exceeded Content-Length");
        }
    });*/
    req.on("end", function() {
        //Transfer ist erfolgreich zu Ende gegangen; also jetzt das Ereignis auslösen
        console.log("Transfer successfully finished");
        if (!res.headersSent) {
            _httpStatus(res, 200, "Ok");
        }
        self.emit(self.UPLOAD_COMPLETE_EVENT,filename);
    });
    req.on("close", function() {
        //Transfer wurde von Sender-Seite abgebrochen
        console.log("Transfer aborted...");
        //winston.error("client abort. close the file stream " + fileId);
        //TODO: vielleicht jetzt hier schon ein Rollback machen...?
        writeSteam.end();
    });
    /*ws.on("close", function() {
        winston.info("closed the file stream " + fileId);
        return winston.debug(util.inspect(res));
    });*/
    return writeSteam.on("error", function(error) {
        //winston.error("closed the file stream " + fileId + " " + (util.inspect(e)));
        console.error("closed the file stream " + fileId + " " + (util.inspect(e)));
        return _httpStatus(res, 500, "File Error");
    });
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
