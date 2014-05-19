# DHT11 / DHT22 Sensor

### Include required files:

``` javascript
var DHT22 = require('./lib/controller/dht22.js');
```

### Initalize sensor

``` javascript
var humidSensor = new DHT22({
  'sensorName': 'demo-sensor', // sensor name (required)
  'pin': 4, // which pin to read (required)
  'database': false, // save reads to database
  'type': 22 // DHT22 = 22 (default), DHT11 = 11
});
```

### Read value
_Notice: This also saves the value to the database if ```database``` is set to ```true```(default)_  
The read() function has to be provided with a callback, to which an error or the read value object will be passed.  
The return value has the following format in case of success ```{ temperature: 12.2, humidity: 11.1 }```.

``` javascript
humidSensor.read(function(error, result) {
  if(error) {
    console.error(error);
  } else {
    console.log('DHT22: Temperatur', result.temperature + '°C');
    console.log('DHT22: Humidity', result.humidity + '%');
  }
});
```
