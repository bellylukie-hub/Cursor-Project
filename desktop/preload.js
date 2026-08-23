const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('TRUCKCONTROL_DESKTOP', {
  platform: process.platform,
  offlineCapable: true
});
