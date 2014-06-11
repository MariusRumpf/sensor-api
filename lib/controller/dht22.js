'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
    _ = require('lodash'),
    Dht22Gpio = require('node-dht-sensor'),
    Dht22Model = mongoose.model('Dht22'),
    LivedataModel = mongoose.model('Livedata'),
    lastHistoricSaveTime = 0;


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
 * @param  {Int}  temp  Temperature reading to check
 * @param  {Int}  humid Humidity reading check
 * @return {Boolean}    Validity
 * @api private
 */
var isValidRead = function(temp, humid) {
  // There seem to be cases where only one of two readings is 0 and the reading
  // is wrong, this is a bad detection for errors but seems the most accurate

  /* jshint eqeqeq: false, -W041 */
  if(temp == 0 || humid == 0) {
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
 * Save read value to a permanent collection for history
 *
 * This saves an entry to a permanent database where the data is available
 * for historic log viewing. Maximum rate is one every minute.
 *
 * @param {object} self
 * @param {mixed} temp  the temperature to save from reading
 * @param {mixed} humidity  the humidity to save from reading
 * @param {function} callback  callback function
 * @api private
 */
var saveHistoricData = function(self, temp, humidity, callback) {
  if(typeof callback !== 'function'){
    throw new Error('Dht22.saveHistoricData() has to be called with callback function');
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

  // Insert reads in two dimensional arrays
  data['temperature.'+ hour + '.' + minute] = temp;
  data['humidity.'+ hour + '.' + minute] = humidity;

  Dht22Model.update(search, data, { 'upsert': true }, function(err, affLn) {
    if(err) {
      return callback(err);
    } else {
      return callback(null);
    }
  });
};

/**
 * Save read values to a temporary collection for live feedback
 *
 * This saves the temperature and humidity to a temporary database for live
 * feed. There is no limit for entries per minute.
 *
 * @param {object} self
 * @param {mixed} tempr temperature reading to save
 * @param {mixed} humidity humidity reading to save
 * @param {function} callback  callback function
 * @api private
 */
var saveLiveData = function(self, tempr, humidity, callback) {
  if(typeof callback !== 'function'){
    throw new Error('Dht22.saveLiveData() has to be called with callback function');
  }

  var temprData,
      hmdiData,
      total = 2,
      current = 0;


  temprData = new LivedataModel({
    sensorName: 'test',
    type: 'dht22-tempr',
    read: tempr
  });

  hmdiData = new LivedataModel({
    sensorName: 'test',
    type: 'dht22-hmdi',
    read: humidity
  });


  temprData.save(function(err) {
    if(err) {
      return callback(err);
    } else {
      current += 1;
      if(current === total) {
        return callback(null);
      }
    }
  });

  hmdiData.save(function(err) {
    if(err) {
      return callback(err);
    } else {
      current += 1;
      if(current === total) {
        return callback(null);
      }
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

  var readout = {},
      repeats = 2,
      timer,
      query,
      self = this;

  // Queries a read from the sensor
  query = function() {
    readout = Dht22Gpio.read();
    readout.temperature = readout.temperature.toFixed(1);
    readout.temperature = parseFloat(readout.temperature);
    readout.humidity = readout.humidity.toFixed(1);
    readout.humidity = parseFloat(readout.humidity);

    if(isValidRead(readout.temperature, readout.humidity)) { // Valid result
      clearInterval(timer);

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
        saveLiveData(self, readout.temperature, readout.humidity, function(err) {
          if(err) {
            return callback(err, readout);
          } else {
            finishedRequests += 1;
            if(finishedRequests === wantedRequests) {
              return callback(null, readout);
            }
          }
        });

        // Save historic data
        if(historicSave) {
          saveHistoricData(self, readout.temperature, readout.humidity, function(err) {
            if(err) {
              return callback(err, readout);
            } else {
              lastHistoricSaveTime = currentTime;
              finishedRequests += 1;
              if(finishedRequests === wantedRequests) {
                return callback(null, readout);
              }
            }
          });
        }

      } else {
        // No saves wanted
        return callback(null, readout);
      }
    } else if(repeats <= 1){ // Too many errors
      clearInterval(timer);
      return callback(new Error('Dht22.read() got invalid read'), null);
    } else { // Try again
      repeats -= 1;
    }
  };

  // Try it multiple times if not valid, timeout is recommended by sensor
  timer = setInterval(query, 1500);
  query(); // Start now
};

/**
 * @ignore
 */
module.exports = Dht22;
