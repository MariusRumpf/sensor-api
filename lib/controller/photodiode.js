'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
		_ = require('lodash'),
		Mcp3008 = require('mcp3008.js'),
		adc = new Mcp3008(),
		LivedataModel = mongoose.model('Livedata'),
		lastHistoricSaveTime = 0;

/**
 * Handles interaction with a photodiode connected through
 * a mcp3008 to the raspberry pi
 *
 * @constructor
 * @param {object} options options for the sensor
 */
function Photodiode(options) {
	this.settings = _.assign({
		'database': true,
	}, options );

	if( typeof this.settings.sensorName === 'undefined') {
		throw new Error('Photodiode: sensorName must be given');
	}
	if( typeof this.settings.pin === 'undefined') {
		throw new Error('Photodiode: pin must be specified');
	} else if(this.settings.pin < 0 || this.settings.pin > 7){
		throw new Error('Photodiode: pin must be between 0 and 7');
	}
}

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
		throw new Error('Photodiode.saveLiveData() has to be called with callback function');
	}

	var dbData = new LivedataModel({
		sensorName: 'test',
		type: 'photodiode',
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
* Reads the value from the photodiode and converts the value from analog to digital.
* The value is then saved as live data if wanted
*
* @return {double} read value
* @api public
*/
Photodiode.prototype.read = function(callback){
	var self = this;
	if(typeof callback !== 'function'){
		return (new Error('Photodiode.read() has to be called with callback function'), null);
	}
	// Read value from mcp3008
	adc.read(this.settings.pin, function(value) {
		if(value <= 0 || value >= 1023) {
			return callback(new Error('Photodiode.read() get\'s invalid response from sensor'), null);
		}
		value /= 1023; // convert from bit to percent
		value *= 100; // Take as percent in human read format
		value = Math.round(value * 10) / 10; // round with 1 decimal place

		if(!value){
			return callback(new Error('Photodiode.read() get\'s no response from sensor'), null);
		}

		// Check if saves are wanted
		if(self.settings.database === true) {

			// Save to live collection
			saveLiveData(self, value, function(err) {
				if(err) {
					return callback(err, value);
				} else {
					return callback(null, value);
				}
			});
		} else {
			// No saves wanted
			return callback(null, value);
		}
	});
};


/**
* @ignore
*/
module.exports = Photodiode;
