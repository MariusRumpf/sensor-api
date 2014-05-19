# TMP35 Sensor

_Notice: This sensor has to be connected over a MCP3008 adc to the raspberry pi, otherwise it won't work._

### Include required files:

``` javascript
var TMP35 = require('./lib/controller/tmp35.js');
```

### Initalize sensor

``` javascript
var tempSensor = new TMP35({
  'sensorName': 'demo-sensor', // A sensor name (required)
  'pin': 0, // Pin of the MCP3008 the sensor is connected to (required)
  'rVoltage': 3.3, // Reference voltage used for calculation, measure with multimeter for better accuracy
  'database' : true, // Save read to the database
});
```

### Read value
_Notice: This also saves the value to the database if ```database``` is set to ```true```(default)_  
The read() function has to be provided with a callback, to which an error or the read value will be passed.  

``` javascript
tempSensor.read(function(error, valueRead) {
    if(error) {
        console.error(error);
    } else {
        console.log('TMP35: Temperature', valueRead + '°C');
    }
});
```
