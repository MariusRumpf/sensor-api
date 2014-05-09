'use strict';


/**
 * Module dependencies.
 */
var config = require('../../config/config.js'),
    mongoose = require('mongoose'),
    expect = require('expect.js'),
    pin = 0,
    testsensorname = 'test-sensor';

require('../../config/bootstrap.js');

var Tmp35Model = mongoose.model('Tmp35');
mongoose.connect(config.db);

/**
 * Main Tests
 */
describe('TMP35 Sensor API', function(){
  var TMP35 = require('../controller/tmp35.js');

  describe('.read()', function() {
    it('should read valid sensor value', function(done) {
      var testTempSensor = new TMP35({
        'sensorName': testsensorname,
        'pin': pin,
        'database': false
      });

      testTempSensor.read(function(err, value){
        if(err) throw err;
        expect(value).to.be.within(10.1,124.9); // hardware limits
        done();
      });
    });

  });

  it('should read and save to database', function(done){
    var testTempSensor = new TMP35({
      'sensorName': testsensorname,
      'pin': pin
    });

    // Save an entry
    testTempSensor.read(function(err, value){
      if(err) throw err;

      // Count the results
      Tmp35Model.count({'sensor': testsensorname}, function(err, count) {
        if(err) throw err;
        expect(count).to.be(1);

        // Remove the test
        Tmp35Model.remove({'sensor': testsensorname}, function(err) {
          if(err) throw err;
          done();
        });

      });
    });
  });
});
