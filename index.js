'use strict';

/**
 * Module dependencies.
 */
var config = require('./config/config.js'),
    mongoose = require('mongoose');

/**
 * Bootstrap db and app
 */
mongoose.connect(config.db);
require('./config/bootstrap.js');
// Log timestamp to console
require('log-timestamp');

/**
 * Your sensor config goes here
 */
var TMP35 = require('./lib/controller/tmp35.js'),
    // DHT22 = require('./lib/controller/dht22.js');

var tempSensor = new TMP35({
  'sensorName': 'temperatur-wohnzimmer',
  'pin': 0,
  'rVoltage': 3.27,
  'database' : true
});

setInterval(function() {
  tempSensor.read(function(err, value) {
    if(err) throw err;
    console.log('Temperatur', value + '°C');
  });
}, 60000);

// var humidSensor = new DHT22({
//   'sensorName': 'dht22-wohnzimmer',
// });
//
// setInterval(function() {
//     humidSensor.read(function(err, value) {
//       if(err) {
//         console.error(err);
//       } else {
//         console.log(value.temp + '°C');
//         console.log(value.hum + '%');
//       }
//     });
// }, 7000);
