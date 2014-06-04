'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
    _ = require('lodash'),
    Mcp3008 = require('mcp3008.js'),
    adc = new Mcp3008(),
    Tmp35Model = mongoose.model('Tmp35'),
    LivedataModel = mongoose.model('Livedata'),
    lastHistoricSaveTime = 0;

/**
 * Handles the interaction a tmp35 sensor connected through
 * a mcp3008 to the raspberry pi
 *
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
 * Save read value to a permanent collection for history
 *
 * This saves an entry to a permanent database where the data is available
 * for historic log viewing. Maximum rate is one every minute.
 *
 * @param {object} self
 * @param {mixed} value  the value to save from reading
 * @param {function} callback  callback function
 * @api private
 */
var saveHistoricData = function(self, value, callback) {
  if(typeof callback !== 'function'){
    throw new Error('Tmp35.saveHistoricData() has to be called with callback function');
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
 * Save a read value to a temporary collection for live feedback
 *
 * This saves the entry to a capped collection where the data has no maximum limit
 * per minute. This data may be used for live feedback to the user.
 *
 * @param {object} self
 * @param {mixed} value  the value to save from reading
 * @param {function} callback  callback function
 * @api private
 */
var saveLiveData = function(self, value, callback) {
  if(typeof callback !== 'function'){
    throw new Error('Tmp35.saveLiveData() has to be called with callback function');
  }

  var dbData = new LivedataModel({
    sensorName: 'test',
    type: 'tmp35',
    read: value
  });

  dbData.save(function(err) {
    if(err) {
      return callback(err);
    } else {
      return callback(null);
    }
  });
};

/**
 * Reads and saves the current state
 *
 * Reads the value from the tmp35 and converts the value from analog to digital.
 * The value is then saved as live data or historic data if wanted
 *
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

    // Check if saves are wanted
    if(self.settings.database === true) {
      var saveHistoricTimeout = 59000,
          currentTime = (new Date().getTime()),
          finishedRequests = 0,
          wantedRequests,
          historicSave;

      // Save a history entry for every minute and a live entry every time
      if(lastHistoricSaveTime === 0 || (currentTime - lastHistoricSaveTime) >= saveHistoricTimeout) {
        wantedRequests = 2; // Live data and historic data
        historicSave = true;
      } else {
        wantedRequests = 1; // Live data only
        historicSave = false;
      }

      // Save to live collection
      saveLiveData(self, value, function(err) {
        if(err) {
          return callback(err, value);
        } else {
          finishedRequests += 1;
          if(finishedRequests === wantedRequests) {
            return callback(null, value);
          }
        }
      });

      // Save historic data
      if(historicSave) {
        saveHistoricData(self, value, function(err) {
          if(err) {
            return callback(err, value);
          } else {
            lastHistoricSaveTime = currentTime;
            finishedRequests += 1;
            if(finishedRequests === wantedRequests) {
              return callback(null, value);
            }
          }
        });
      }

    } else {
      // No saves wanted
      return callback(null, value);
    }
  });
};

/**
 * @ignore
 */
module.exports = Tmp35;
