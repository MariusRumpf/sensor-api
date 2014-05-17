'use strict';

var utilities = require('./util');

/* jshint bitwise: false */
process.env.NODE_ENV = ~utilities.walk('./config/env', /(.*)\.js$/).map(function(file) {
    return file.split('/').pop().slice(0, -3);
}).indexOf(process.env.NODE_ENV) ? process.env.NODE_ENV : 'development';

// Load app configuration
module.exports = require('./env/' + process.env.NODE_ENV) || {};
