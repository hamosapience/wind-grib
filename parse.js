var csv = require('csv');
var fs = require('fs');
var _ = require('lodash');

var COLUMNS = [
    "time0",
    "time1",
    "field",
    "level",
    "longitude",
    "latitude",
    "value"
];

var LEFT_LON = 25; // долгота левой границы
var RIGHT_LON = 175; // долгота правой границы

var UP_LAT = 75; // широта верхней границы
var DOWN_LAT = 40; // широта нижней границы

var STEP = 1; // шаг координатной сетки

function createCoordNet(){
    var longitudeSteps = (RIGHT_LON - LEFT_LON) / STEP + 1;
    var latitudeSteps = (UP_LAT - DOWN_LAT) / STEP + 1;
    var arr = new Array(latitudeSteps);
    for (var i = 0; i < latitudeSteps; i++){
        arr[i] = new Array(longitudeSteps);
    }
    return arr;
}

function calculateIndex(latitude, longitude){
    return [(latitude - DOWN_LAT) / STEP, (longitude - LEFT_LON) / STEP];
}

function filterDataItem(dataItem){
    return (
        dataItem.longitude >= LEFT_LON &&
        dataItem.longitude <= RIGHT_LON &&
        dataItem.latitude >= DOWN_LAT &&
        dataItem.latitude <= UP_LAT
    );
}

var parser = csv.parse({
    columns: COLUMNS
});

var record;
var dataItems = [];
var coordNet = createCoordNet(); // широта, долгота


parser.on('readable', function() {
    while (record = parser.read()){
        if (filterDataItem(record)){
            dataItems.push(record);
        }
    }
});

parser.on('error', function(err){
    console.log(err.message); //FIXME: хорошо бы сразу сообщить об ошибке
});

parser.on('finish', function(){

    var date;

    var coordHash = dataItems.reduce(function(hash, item){
        var key = item.latitude + ',' + item.longitude;
        var index = calculateIndex(item.latitude, item.longitude);
        date = item.time0;
        item[item.field] = parseFloat(item.value);
        hash[key] = _.assign(item, hash[key] || {
            index: index
        });
        return hash;
    }, {});

    _.values(coordHash).forEach(function(item){
        coordNet[item.index[0]][item.index[1]] = [item.UGRD, item.VGRD];
    });

    fs.writeFileSync('./tmp/wind.json~', JSON.stringify({
        meta: {
            LEFT_LON: LEFT_LON,
            RIGHT_LON: RIGHT_LON,
            UP_LAT: UP_LAT,
            DOWN_LAT: DOWN_LAT,
            STEP: STEP,
            date: date
        },
        data: coordNet
    }));

});

fs.createReadStream('./tmp/data.csv').pipe(parser);






























