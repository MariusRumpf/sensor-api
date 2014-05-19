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
    DHT22 = require('./lib/controller/dht22.js'),
    lastTmp35ReadValue = 0;

var tempSensor = new TMP35({
  'sensorName': 'temperatur-wohnzimmer',
  'pin': 0,
  'rVoltage': 3.27,
  'database' : false
});

setInterval(function() {
  tempSensor.read(function(err, value) {
    if(err) { console.error(err); }
    else {
      lastTmp35ReadValue = value;
      console.log('TMP35: Temperatur', value + '°C');
    }
  });
}, 5000);

var humidSensor = new DHT22({
  'sensorName': 'dht22-wohnzimmer',
  'pin': 4,
  'database': false
});

setInterval(function() {
    humidSensor.read(function(err, value) {
      if(err) { console.error(err); }
      else {
        console.log('DHT22: Temperatur', value.temperature + '°C');
        console.log('DHT22: Luftfeuchtigkeit', value.humidity + '%');
        console.log('Offset Temperatur:', (lastTmp35ReadValue - value.temperature).toFixed(1));
      }
    });
}, 5000);
