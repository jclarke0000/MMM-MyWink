/*

  MMM-MyWink
  -------------------------------------------
  by Jeff Clarke
  https://github.com/jclarke0000/MMM-MyWink
  Lisense: MIT

  MagicMirror module to monitor and display the status of
  door locks and garage doors connected to your Wink hub.
  Wink API client_id and client_secret keys are required.
  Resuest them at https://developer.wink.com/clients.

  This module contacts the Wink API to determine the initial
  status of your devices, then subscribes to PubNub to listen
  for changes in their state

*/

var NodeHelper = require('node_helper');
var wink = require('wink-jsv2');
var PubNub = require('pubnub');

module.exports = NodeHelper.create({

  start: function() {

    moduleInstance = this;
    this.started = false;
    this.deviceList = null;
    this.pubnub = null;
    this.pnListener = null;
    this.pnSubscriptions = null;

  },

  socketNotificationReceived: function(notification, payload){

    var self = this;

    if (notification === 'MMM-MYWINK-GET-INITIAL-STATUS') {

      if (this.started) {

        /*
          node_helper.js has already gone through its initialization
          send the current list of devices with their status back to
          the frotn end.
        */
        this.sendSocketNotification('MMM-MYWINK-DEVICE-UPDATE', {data: this.deviceList});

      } else {

        this.config = payload;

        //log into Wink account and set up subscriptions
        this.initialize();

        //set up some cleanup on application exit
        process.on('SIGINT', function () {  
          console.log("[MMM-MyWink] Cleaning Up");
          self.pubnub.removeListener(self.pnListener);
          self.pubnub.unsubscribeAll();
          process.exit();
        });

      } 


    }
  },

  /*
    This performs the login to the Wink API.
    Upon completion, if there are no errors,
    the getDevices() routine is called.
  */
  initialize: function() {

    console.log("[MMM-MyWink] Initializing");

    var self = this;

    //log into wink account
    wink.init({
      "client_id": this.config.client_id,
      "client_secret": this.config.client_secret,
      "username": this.config.username,
      "password": this.config.password
    }, function(auth_return) {

      if ( auth_return === undefined ) {
        console.log("[MMM-MyWink] **Error** Could not get authorization.");
      } else {
        self.getDevices();
      }

    });

  },

  /*
    This retrieves the list of devices connected to the Wink hub,
    filters them to locks and garage doors, and saves the initial
    state.  This is sent back to the front end for display.
    Finally, the createListeners() routine is called to set up
    the PubNub subscriptions and listener for device updates.
  */
  getDevices: function() {

    var self = this;

    wink.user().devices(function(data) {

      //filter to locks and garage doors
      var filteredDevices = data.data.filter(function(device) {
        return (device.object_type == "lock" || device.object_type == "garage_door");
      });

      self.deviceList = new Array();
      self.pnSubscriptions = new Array();

      filteredDevices.forEach(function(device) {

        var status;
        switch (device.object_type) {
          case "lock":
            status = device.last_reading.locked;
            break;
          case "garage_door":
            status = device.last_reading.position;
            break;
        }

        self.deviceList.push({
          id: device.object_id,
          name: device.name,
          type: device.object_type,
          status: status
        });

        /*
          We need the subscription info for the next routine, but
          since the deviceList array gets passed back to the front
          end, we don't want to constantly pass the subscription
          info over the network.  So it will be stored locally in a
          separate array variable.
        */
        self.pnSubscriptions.push(device.subscription);

      });

      //send initial status back to the front end for display
      self.sendSocketNotification('MMM-MYWINK-DEVICE-UPDATE', {data: self.deviceList});

      //set up listeners
      self.createListeners();

    });



  },


  /*
    Real time updates for devices connected to Wink are broadcast via
    PubNub (https://www.pubnub.com/). The Wink API provides the
    subscription keys and channels for each device, and we use them
    below to set up a listener for device updates.
  */
  createListeners: function() {

    var self = this;

    this.pubnub = new PubNub({
      subscribeKey: this.pnSubscriptions[0].pubnub.subscribe_key,
      ssl: true
    });

    this.pnListener = this.pubnub.addListener({
      message: function(m) {
        console.log("[MMM-MyWink] Device Broadcast Received");
        self.deviceUpdate(m.message);
      }
    });

    var subChannels = new Array();
    this.pnSubscriptions.forEach(function(sub) {
      subChannels.push(sub.pubnub.channel);
    });

    this.pubnub.subscribe({
      channels: subChannels
    });

    //set the "started" flag so that we don't repeat this routine.
    this.started = true;

  },

  /*
    For locks and garage doors, two updates come through per change
    of state.  The first comes through when the user requests a
    change (e.g.: when the taps the "unlock" icon on their phone).
    The second comes through after the change is complete.  When an
    update comes through, we compare the current state rported by the
    broadcast to the device's state as saved in the local deviceList
    array.  We only update the local array of the actual state in the
    update is different, and subsequently only broadcast that change
    to the front end in the same circumstance.
  */
  deviceUpdate: function(rawData) {

    var updateData = JSON.parse(rawData);

    var deviceId;
    if (updateData.object_id) {
      deviceId = updateData.object_id;
    } else if (updateData.lock_id) {
      deviceId = updateData.lock_id;
    } else if (updateData.garage_door_id) {
      deviceId = updateData.garage_door_id;
    }

    var device = this.deviceList.find(function(device) {
      return device.id == deviceId;
    });

    var deviceChanged = false;
    switch (device.type) {
      case "lock" :
        if (updateData.last_reading.locked != device.status) {
          device.status = updateData.last_reading.locked;
          deviceChanged = true;
        }
        break;
      case "garage_door" :
        if (updateData.last_reading.position != device.status) {
          device.status = updateData.last_reading.position;
          deviceChanged = true;          
        }
        break;
    }

    //only send a notification back to the front end if the device status has changed
    if (deviceChanged) {
      console.log("[MMM-MyWink] Device Update");
      this.sendSocketNotification('MMM-MYWINK-DEVICE-UPDATE', {data: this.deviceList});
    }

  }



});