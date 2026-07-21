const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('arborflow', {
  platform: process.platform,
  openText: (options) => ipcRenderer.invoke('file:open-text', options),
  saveText: (options) => ipcRenderer.invoke('file:save-text', options),
  onMenuCommand: (callback) => {
    const listener = (_event, command) => callback(command)
    ipcRenderer.on('menu:command', listener)
    return () => ipcRenderer.removeListener('menu:command', listener)
  },
})
