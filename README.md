# tus-server
[TUS Protocol 0.2.1](http://www.tus.io/protocols/resumable-upload.html) Server Implementation in nodejs, using express

Right now it is a heavy work in progress and it does not claim to be compatible to the tus.io protocol. But stay tuned!

## Configuration
edit config.json
```js
{
	"port":5000,
    "prefixPath":"/upload/", //prefix for URL, where the service is waiting
    "fileUploadPath":"files", //path to dir, where files are stored
    "serverString":"tus-server", //Server-Agent :)
    "logDir": "logs", //Winston-Options...
    "logRotateSize": 10485760,
    "logLevel": "info",
    "host":"127.0.0.1" //Address, that the server should bind to
}
```
- Allowed [log levels](https://github.com/flatiron/winston#using-logging-levels): debug, info, warn, error
- LogRotateSize: 10MB default

## Install
```
npm install
```

## Demo

```
node app.js
```

## Usage
See app.js for a simple example and for the usage of the various events.

##Thanks
Many thank go out for (https://github.com/vayam) with his nodejs implementation
(https://github.com/vayam/brewtus), that this implementation is based on.

## License
[MIT License](LICENSE.md).
