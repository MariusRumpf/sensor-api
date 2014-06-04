'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Sensor Schema
 */
var LivedataSchema = new Schema({
  sensorName: {
    type: String,
    default: '',
    trim: true,
    required: 'Name cannot be blank'
  },
  type: {
    type: String,
    default: '',
    trim: true,
    required: 'Type cannot be blank'
  },
  read: {
    type: Object,
    trim: true,
    required: 'Read cannot be empty'
  },
}, {capped: {size: 4096, max: 1000}, collection: 'livedata'});

mongoose.model('Livedata', LivedataSchema);
