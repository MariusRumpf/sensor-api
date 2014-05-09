var path = require('path'),
    utilities = require('./util');

// Initialize models
utilities.walk('./lib/model').forEach(function(modelPath) {
  require(path.resolve(modelPath));
});
