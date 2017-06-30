Module.register('MMM-MyWink', {

  defaults: {
    pollFrequency: 30 * 1000, //2 minutes;
  },

  start: function() {
    this.loaded = false;
    this.devices = [];

    this.sendSocketNotification("MMM-MYWINK-GET", this.config);
    var self = this;
    setInterval(function() {
      self.sendSocketNotification("MMM-MYWINK-GET", self.config);
    }, this.config.pollFrequency);
  },

  getStyles: function () {
    return ["MMM-MyWink.css"];
  },

  socketNotificationReceived: function(notification, payload) {
    //only update if a data set is returned.  Otherwise leave stale data on the screen.
    if ( notification === 'MMM-MYWINK-RESPONSE') {
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

      var deviceContainer = document.createElement("div");
      deviceContainer.classList.add("device-container", device.status.toLowerCase());

      var deviceName = document.createElement("span");
      deviceName.classList.add("device-name");
      deviceName.innerHTML = device.name;
      deviceContainer.appendChild(deviceName);

      var iconContainer = document.createElement("span");
      iconContainer.classList.add("icon-container");
      iconContainer.appendChild(self.svgIconFactory(device.type.toLowerCase() + "_" + device.status.toLowerCase()));
      deviceContainer.appendChild(iconContainer);

      var deviceStatus = document.createElement("span");
      deviceStatus.classList.add("device-status");
      deviceStatus.innerHTML = device.status;
      deviceContainer.appendChild(deviceStatus);


      wrapper.appendChild(deviceContainer);
    });

    return wrapper;

  }

});