var fs = require('fs-extra');
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

setInterval(function(){

    try {
        fs.readFile('./tmp/wind.json~', function(error, data){
            if (error){
                pmx.notify('READ FILE ERROR ' + error);
                return;
            }
            try {
                var parsed = JSON.parse(data);
                var validationResult = jsonSchema.validate(parsed, SCHEMA);
                if (!validationResult.valid){
                    pmx.notify('SCHEMA VALIDATION ERROR ' + JSON.stringify(validationResult.errors));
                    return;
                }

                fs.copy('./tmp/wind.json~', './tmp/wind.json', function(error){
                    if (error){
                        pmx.notify('RELEASE ERROR ' + error);
                    }
                });

            }
            catch (e){
                pmx.notify('PARSE ERROR ' + e);
            }
        });
    }
    catch(e){
        pmx.notify(e);
    }

}, 60 * 1000);