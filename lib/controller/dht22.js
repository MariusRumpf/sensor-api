'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
    _ = require('lodash'),
    Dht22Gpio = require('sensor-am2302'),
    sensorGpio = new Dht22Gpio({pin : 4});

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
 * Reads the current state of the dht22
 * @return {double} read value
 */
Dht22.prototype.read = function(callback){
  var self = this;
  if(typeof callback !== 'function'){
    return (new Error('Dht22.read() has to be called with callback function'), null);
  }
  // Read value from dht22
  sensorGpio.read(function(err, data) {
    if(err) {
      callback(err, null);
    }

    // if(self.settings.database === true) {
    //   save(self, value, function(err) {
    //     if(err) {
    //       return callback(err, value);
    //     } else {
    //       return callback(null, value);
    //     }
    //   });
    // } else {
      return callback(null, data);
    // }
  });
}

/**
 * @ignore
 */
module.exports = Dht22;
