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
var TMP35 = require('./lib/controller/tmp35.js');

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
