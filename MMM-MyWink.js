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

Module.register('MMM-MyWink', {

  start: function() {
    this.loaded = false;
    this.devices = [];

    this.sendSocketNotification("MMM-MYWINK-GET-INITIAL-STATUS", this.config);

  },

  getStyles: function () {
    return ["MMM-MyWink.css"];
  },

  socketNotificationReceived: function(notification, payload) {
    //only update if a data set is returned.  Otherwise leave stale data on the screen.
    if ( notification === 'MMM-MYWINK-DEVICE-UPDATE') {
      this.devices = payload.data;
      if (this.loaded) {
        this.updateDom();      
      } else {
        this.loaded = true;
        this.updateDom(2000);      
      }
    }

  },

  svgIconFactory: function(glyph) {

    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttributeNS(null, "class", "icon");
    var use = document.createElementNS('http://www.w3.org/2000/svg', "use");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", "modules/MMM-MyWink/icon_sprite.svg#" + glyph);
    svg.appendChild(use);
    
    return(svg);
  },  

  getDom: function() {

    var self = this;

    var wrapper = document.createElement("div");
    wrapper.classList.add("wrapper", "device-list");

    if (!this.loaded) {
      wrapper.innerHTML = this.translate('LOADING');
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    this.devices.forEach(function(device) {

      var status;
      switch (device.type) {
        case "lock":
          status = device.status == true ? "Locked" : "Unlocked";
          break;
        case "garage_door":
          status = device.status == 1 ? "Open" : "Closed";
          break;
      }

      var deviceContainer = document.createElement("div");
      deviceContainer.classList.add("device-container", status.toLowerCase());

      var deviceName = document.createElement("span");
      deviceName.classList.add("device-name");
      deviceName.innerHTML = device.name;
      deviceContainer.appendChild(deviceName);

      var iconContainer = document.createElement("span");
      iconContainer.classList.add("icon-container");
      iconContainer.appendChild(self.svgIconFactory(device.type.toLowerCase() + "_" + status.toLowerCase()));
      deviceContainer.appendChild(iconContainer);

      var deviceStatus = document.createElement("span");
      deviceStatus.classList.add("device-status");
      deviceStatus.innerHTML = status;
      deviceContainer.appendChild(deviceStatus);


      wrapper.appendChild(deviceContainer);
    });

    return wrapper;

  }

});