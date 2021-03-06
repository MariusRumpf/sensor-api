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
    Photodiode = require('./lib/controller/photodiode.js');

var tempSensor = new TMP35({
  'sensorName': 'tmp35-wohnzimmer',
  'pin': 0,
  'rVoltage': 3.27,
  'database' : true
});

var humidSensor = new DHT22({
  'sensorName': 'dht22-wohnzimmer',
  'pin': 4,
  'database': true
});

var lightSensor = new Photodiode({
  'sensorName': 'photodiode1',
  'pin': 1,
  'database': true
});


setInterval(function() {
  tempSensor.read(function(err) {
    if(err) {
      console.error(err);
    }
  });
}, 2000);

setInterval(function() {
    humidSensor.read(function(err) {
      if(err) {
        console.error(err);
      }
    });
}, 2000);

setInterval(function() {
    lightSensor.read(function(err) {
      if(err) {
        console.error(err);
      }
    });
}, 2000);
