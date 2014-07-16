/**
 * Created by chris on 18.06.14.
 */

//startet den eigentlichen Server und bindet diesen ein...

var tusserver = require('./server');

//statische Config lesen
var CONFIG = require('./config.json');

tusserver.on(tusserver.READY_EVENT,function(){
   console.log("Upload server is ready...");
});

tusserver.on(tusserver.UPLOAD_COMPLETE_EVENT,function(filename) {
   console.log("File:",filename,"was uploaded.")
});

tusserver.on(tusserver.UPLOAD_EVENT,function(filename){
    console.log("File:",filename,"is currently being uploaded.");
});

tusserver.on(tusserver.UPLOAD_ABORTED,function(filename){
   console.log("Error uploading file:",filename);
});

tusserver.initServer(CONFIG);