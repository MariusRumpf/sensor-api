'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
    _ = require('lodash'),
    Dht22Gpio = require('node-dht-sensor');

/**
 * Handles the interaction a dht22 sensor connected to the raspberry pi
 * @constructor
 * @param {object} options  options for the sensor
 */
function Dht22(options) {
  this.settings = _.assign({
    'database': true,
  }, options );

  if( typeof this.settings.sensorName === 'undefined') {
    throw new Error('DHT22: sensorName must be given');
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
  if(temp === 0 && humid === 0) {
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
 * Reads the current state of the dht22
 * @return {double} read value
 */
Dht22.prototype.read = function(callback){
  if(typeof callback !== 'function'){
    return (new Error('Dht22.read() has to be called with callback function'), null);
  }

  Dht22Gpio.initialize(22, this.settings.pin);

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
