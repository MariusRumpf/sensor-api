'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
    _ = require('lodash'),
    Dht22Gpio = require('node-dht-sensor'),
    Dht22Model = mongoose.model('Dht22');


/**
 * Handles the interaction a dht22 sensor connected to the raspberry pi
 * @constructor
 * @param {object} options  options for the sensor
 */
function Dht22(options) {
  this.settings = _.assign({
    'database': true,
    'type': 22, // DHT22 = 22 default, DHT11 = 11
  }, options );

  if( typeof this.settings.sensorName === 'undefined') {
    throw new Error('DHT22: sensorName setting must be given');
  }

  if( typeof this.settings.pin === 'undefined') {
    throw new Error('DHT22: pin must be specified');
  }
}


/**
 * Checks of a temperature and humidity read is valid
 * @param  {Int}  temp  Temperature reading
 * @param  {Int}  humid Humidity reading
 * @return {Boolean}    Validity
 * @api private
 */
var isValidRead = function(temp, humid) {
  /* jshint eqeqeq: false, -W041 */
  if(temp == 0 && humid == 0) {
    return false;
  } else if(temp < -39 || temp > 79) {
    return false;
  } else if(humid < 0 || humid > 100) {
    return false;
  } else {
    return true;
  }
};

/**
 * Save read value to the database
 *
 * The read data is saved in documents for each hour
 * The read value contains a 2-dimensional array with the reads
 * the first demension is the hour the second the minute
 * Both readings humidity and temperature are saved this way
 * in the same document
 *
 * @param {object} self
 * @param {mixed} value  the value to save from reading
 * @param {function} callback  callback function
 * @api private
 */
var save = function(self, value, callback) {
  if(typeof callback !== 'function'){
    throw new Error('Dht22.save() has to be called with callback function');
  }

  var date = new Date(),
      hour = date.getHours(),
      minute = date.getMinutes(),
      hourTimestamp = date.setMinutes(0, 0, 0),
      data = {};

  // Base data
  var search = {
    timestamp: hourTimestamp,
    sensor: self.settings.sensorName,
  };

  // Insert read in two dimensional array
  data['read.'+ hour + '.' + minute] = value;

  Dht22Model.update(search, data, { 'upsert': true }, function(err, affLn) {
    if(err) {
      return callback(err);
    } else {
      return callback(null);
    }
  });
};

/**
 * Reads the current state of the dht22
 * @return {double} read value
 */
Dht22.prototype.read = function(callback){
  if(typeof callback !== 'function'){
    return (new Error('Dht22.read() has to be called with callback function'), null);
  }

  Dht22Gpio.initialize(this.settings.type, this.settings.pin);

  var readout = {};

  readout = Dht22Gpio.read();
  readout.temperature = readout.temperature.toFixed(1);
  readout.humidity = readout.humidity.toFixed(1);

  if(isValidRead(readout.temperature, readout.humidity)) {
    return callback(null, readout);
  }

  setTimeout(function() {
    readout = Dht22Gpio.read();
    readout.temperature = readout.temperature.toFixed(1);
    readout.humidity = readout.humidity.toFixed(1);

    if(isValidRead(readout.temperature, readout.humidity)) {
      return callback(null, readout);
    } else {
      return callback(new Error('Invalid read'), null);
    }
  }, 1500);

};

/**
 * @ignore
 */
module.exports = Dht22;
