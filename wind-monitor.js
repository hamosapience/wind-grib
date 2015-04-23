var fs = require('fs');
var pmx = require('pmx');
var jsonSchema = require('json-schema');

var SCHEMA = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "title": "Wind data",
    "type": "object",
    "properties": {
        "meta": {
            "type": "object",
            "properties": {
                "LEFT_LON": {"type": "number"},
                "RIGHT_LON": {"type": "number"},
                "UP_LAT": {"type": "number"},
                "DOWN_LAT": {"type": "number"},
                "STEP": {"type": "number"},
                "date": {
                    "type": "string",
                    "pattern": "\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2}" // "2015-04-22 00:00:00"
                }
            }
        },
        "data": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "types": "array",
                    "minItems": 2,
                    "maxItems": 2,
                    "items": {
                        "type": "number"
                    }
                }
            }
        }
    },
    "definitions": {
        "date": {
            "type": "string",
            "pattern": "\s+"
        }
    },
    "required": ["meta", "data"]
};

var SOURCE_FILE = './tmp/wind.json~';
var DEST_FILE = './tmp/wind.json';
var LOG_FILE = './log/get.log';

function notify(e){
    console.warn(e);
    pmx.notify(e);
}

function emit(event, data){
    pmx.emit(event, data);
}

function wrap(f, errorType) {
    return function() {
        try {
            return f.apply(this, arguments);
        } catch(e) {
            notify(errorType + ' ' + e);
        }
    };
}

function dataValidator(data){

    try {
        var parsed = JSON.parse(data);
    }
    catch (e){
        return ('PARSE ERROR ' + e);
    }

    var validationResult = jsonSchema.validate(parsed, SCHEMA);
    if (!validationResult.valid){
        return ('SCHEMA VALIDATION ERROR ' + JSON.stringify(validationResult.errors));
    }

    var parsedDate = new Date(parsed.meta.date); // Dates in GRIB are in UTC+0 timezone
    var currentDate = new Date();
    if (parsedDate.getDate() !== currentDate.getUTCDate() ||
        parsedDate.getMonth() !== currentDate.getUTCMonth() ||
        parsedDate.getFullYear() !== currentDate.getUTCFullYear()
    ){
        return ('DATA OUTDATED ' + parsedDate + ' current: ' + currentDate.toUTCString());
    }
}

function logValidator(){
    try {
        var log = fs.readFileSync(LOG_FILE, 'utf8');
    }
    catch (e){
        return ('OPEN LOG ERROR ' + e);
    }
    var errors = log.match(/error/ig);
    if (errors.length){
        return ('ERROR IN LOG ' + log);
    }
}

function worker(){

    var logValidationError = logValidator();
    if (logValidationError){
        notify(logValidationError);
        return;
    }

    try {
        var data = fs.readFileSync(SOURCE_FILE, 'utf8');
        var currentData = fs.readFileSync(DEST_FILE, 'utf8');
    }
    catch(e){
        notify('READ FILE ERROR ' + e);
        return;
    }

    var validationError = dataValidator(data);
    if (validationError){
        notify(validationError);
        return;
    }

    if (data !== currentData){
        fs.writeFile(DEST_FILE, data, function(error){
            if (error){
                notify('RELEASE ERROR ' + error);
                return;
            }
            emit('data_update', {
                ok: true
            });
        });
    }

}

setInterval(wrap(worker, 'RUNTIME ERROR'), 10 * 60 * 1000);
