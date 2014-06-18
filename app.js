/**
 * Created by chris on 18.06.14.
 */

//startet den eigentlichen Server und bindet diesen ein...

var tusserver = require('./server');

//statische Config lesen
var CONFIG = require('./config.json');

tusserver.on(tusserver.READY_EVENT,function(){
   console.log("Locked and loaded!");
});

tusserver.initServer();