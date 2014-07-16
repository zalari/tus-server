/**
 * Created by chris on 18.06.14.
 */

//startet den eigentlichen Server und bindet diesen ein...

var tusserver = require('./server');

//statische Config lesen
var CONFIG = require('./config.json');

tusserver.on(tusserver.READY_EVENT,function(){
   console.log("Upload-Server ist bereit...");
});

tusserver.on(tusserver.UPLOAD_COMPLETE_EVENT,function(filename) {
   console.log("Datei:",filename,"wurde hochgeladen.")
});

tusserver.on(tusserver.UPLOAD_EVENT,function(filename){
    console.log("Datei:",filename,"wird gerade hochgeladen...");
});

tusserver.on(tusserver.UPLOAD_ABORTED,function(filename){
   console.log("Fehler beim Upload von:",filename);
});

tusserver.initServer(CONFIG);