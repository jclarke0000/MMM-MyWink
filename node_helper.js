var wink = require('wink-jsv2');

module.exports = NodeHelper.create({

  start: function() {
    moduleInstance = this;
    this.isAuthorized = false;
    process.env.WINK_NO_CACHE = true;
  },

  socketNotificationReceived: function(notification, payload){
    if (notification === 'MMM-MYWINK-GET') {

      if (this.config == null) {      
        this.config = payload;
      }

      if (this.isAuthorized) {
        this.getDevices();
      } else {
        this.authorize();
      }

    }
  },

  authorize: function() {

    var self = this;

    wink.init({
      "client_id": this.config.client_id,
      "client_secret": this.config.client_secret,
      "username": this.config.username,
      "password": this.config.password
    }, function(auth_return) {

      if ( auth_return === undefined ) {
        console.log("[MMM-MyWink] **Error** Could not get authorization.");
      } else {
        self.isAuthorized = true;
        self.getDevices();
      }

    });

  },

  getDevices: function() {

    var self = this;

    wink.user().devices(function(data) {

      //filter to locks and garage doors
      var filteredDevices = data.data.filter(function(device) {
        return (device.object_type == "lock" || device.object_type == "garage_door");
      });

      var devicesToReturn = [];
      filteredDevices.forEach(function(device) {
        var status;
        switch (device.object_type) {
          case "lock":
            status = device.last_reading.locked ? "Locked" : "Unlocked";
            break;
          case "garage_door":
            status = device.last_reading.position == 1 ? "Open" : "Closed";
            break;
        }

        devicesToReturn.push({
          name: device.name,
          type: device.object_type,
          status: status
        });

      });

      self.sendSocketNotification('MMM-MYWINK-RESPONSE', {data: devicesToReturn});

    });



  }


});