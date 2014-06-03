'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
    _ = require('lodash'),
    Mcp3008 = require('mcp3008.js'),
    adc = new Mcp3008(),
    Tmp35Model = mongoose.model('Tmp35');

/**
 * Handles the interaction a tmp35 sensor connected through
 * a mcp3008 to the raspberry pi
 * @constructor
 * @param {object} options  options for the sensor
 */
function Tmp35(options) {
  this.settings = _.assign({
    'rVoltage': 3.3,
    'database': true,
  }, options );

  if( typeof this.settings.sensorName === 'undefined') {
    throw new Error('TMP35: sensorName must be given');
  }
  if( typeof this.settings.pin === 'undefined') {
    throw new Error('TMP35: pin must be specified');
  } else if(this.settings.pin < 0 || this.settings.pin > 7){
    throw new Error('TMP35: pin must be between 0 and 7');
  }
}

/**
 * Save read value to the database
 *
 * The read data is saved in documents for each hour
 * The read value contains a 2-dimensional array with the reads
 * the first demension is the hour the second the minute
 *
 * @param {object} self
 * @param {mixed} value  the value to save from reading
 * @param {function} callback  callback function
 * @api private
 */
var save = function(self, value, callback) {
  if(typeof callback !== 'function'){
    throw new Error('Tmp35.save() has to be called with callback function');
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
  data['read.'+ hour + '.' + minute] = parseFloat(value);

  Tmp35Model.update(search, data, { 'upsert': true }, function(err, affLn) {
    if(err) {
      return callback(err);
    } else {
      return callback(null);
    }
  });
};

/**
 * Reads the current state of the tmp35
 * @return {double} read value
 * @api public
 */
Tmp35.prototype.read = function(callback){
  var self = this;
  if(typeof callback !== 'function'){
    return (new Error('Tmp35.read() has to be called with callback function'), null);
  }
  // Read value from mcp3008
  adc.read(this.settings.pin, function(value) {
    if(value <= 0 || value >= 1023) {
      return callback(new Error('Tmp35.read() get\'s invalid response from sensor'), null);
    }
    value = value / self.settings.rVoltage; // convert from bit to celsius
    value = value - 0.5; // 500mv offset from datasheet
    value = Math.round(value * 10) / 10; // round with 1 decimal place

    if(!value){
      return callback(new Error('Tmp35.read() get\'s no response from sensor'), null);
    }

    if(self.settings.database === true) {
      save(self, value, function(err) {
        if(err) {
          return callback(err, value);
        } else {
          return callback(null, value);
        }
      });
    } else {
      return callback(null, value);
    }
  });
};

/**
 * @ignore
 */
module.exports = Tmp35;
