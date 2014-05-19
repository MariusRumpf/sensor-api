'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Sensor Schema
 */
var Dht22Schema = new Schema({
  timestamp: {
    type: Date,
    required: 'Date with precision of hour must be given'
  },
  sensor: {
    type: String,
    default: '',
    trim: true,
    required: 'Name cannot be blank'
  },
  temperature: {
    type: Object
  },
  humidity: {
    type: Object
  }
});

mongoose.model('Dht22', Dht22Schema);
