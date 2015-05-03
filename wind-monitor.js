var fs = require('fs');
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

var ERROR_TYPES = {
    'PARSE_ERROR': 'PARSE ERROR',
    'SCHEMA_VALIDATION_ERROR': 'SCHEMA VALIDATION ERROR',
    'OPEN_LOG_ERROR': 'OPEN LOG ERROR',
    'GET_ERROR': 'GET ERROR',
    'READ_FILE_ERROR': 'READ FILE ERROR',
    'RELEASE_ERROR': 'RELEASE ERROR',
    'RUNTIME_ERROR': 'RUNTIME ERROR',
    'DEST_FILE_EMPTY': 'DEST FILE EMPTY'
};

var SOURCE_FILE = './tmp/wind.json~';
var DEST_FILE = './data/wind.json';
var LOG_FILE = './log/get.log';

var MONITOR_INTERVAL = 10 * 60 * 1000;

function notify(errorType, error){
    var msg = ( (new Date()).toJSON() + ' ERROR[' + errorType + '] ' + error );

    console.log(msg);
}

function log(event, data){
    console.log( (new Date()).toJSON() + ' LOG[' + event + '] ' + JSON.stringify(data) );
}

function wrap(f, errorType) {
    return function() {
        try {
            return f.apply(this, arguments);
        } catch(e) {
            notify(errorType, e.message + ' ' + e.stack);
        }
    };
}

function dataValidator(data){

    try {
        var parsed = JSON.parse(data);
    }
    catch (e){
        return (ERROR_TYPES.PARSE_ERROR, e);
    }

    var validationResult = jsonSchema.validate(parsed, SCHEMA);
    if (!validationResult.valid){
        return ERROR_TYPES.SCHEMA_VALIDATION_ERROR;
    }

    var parsedDate = new Date(parsed.meta.date); // Dates in GRIB are in UTC+0 timezone
    var currentDate = new Date();
    if (parsedDate.getDate() !== currentDate.getUTCDate() ||
        parsedDate.getMonth() !== currentDate.getUTCMonth() ||
        parsedDate.getFullYear() !== currentDate.getUTCFullYear()
    ){
        // return ('DATA OUTDATED ' + parsedDate + ' current: ' + currentDate.toUTCString());
    }
}

function logValidator(){
    try {
        var log = fs.readFileSync(LOG_FILE, 'utf8');
    }
    catch (e){
        return (ERROR_TYPES.OPEN_LOG_ERROR, e);
    }
    var errors = log.match(/error/ig);
    if (errors){
        return (ERROR_TYPES.GET_ERROR, log);
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
    }
    catch(e){
        notify(ERROR_TYPES.READ_FILE_ERROR, e);
        return;
    }

    var currentData = '';
    try {
        currentData = fs.readFileSync(DEST_FILE, 'utf8');
    }
    catch(e){
        log(ERROR_TYPES.DEST_FILE_EMPTY, '');
    }

    var validationError = dataValidator(data);
    if (validationError){
        notify(validationError, '');
        return;
    }

    if (data !== currentData){
        fs.writeFile(DEST_FILE, data, function(error){
            if (error){
                notify(ERROR_TYPES.RELEASE_ERROR, error);
                return;
            }
            log('data_update', {
                ok: true
            });
        });
    }

}

MONITOR_INTERVAL = 2000

setInterval(wrap(worker, ERROR_TYPES.RUNTIME_ERROR), MONITOR_INTERVAL);
