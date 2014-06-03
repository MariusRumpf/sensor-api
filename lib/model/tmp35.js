'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Sensor Schema
 */
var Tmp35Schema = new Schema({
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
  read: {
    type: Object
  }
});

mongoose.model('Tmp35', Tmp35Schema);
