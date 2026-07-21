const { app, BrowserWindow } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')

app.whenReady().then(async () => {
  const svg = await fs.readFile(path.join(__dirname, '..', 'public', 'arborflow.svg'), 'utf8')
  const window = new BrowserWindow({
    width: 512,
    height: 512,
    show: false,
    transparent: true,
    frame: false,
    webPreferences: { offscreen: true },
  })
  await window.loadURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`)
  const image = await window.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 })
  await fs.writeFile(path.join(__dirname, '..', 'build', 'icon.png'), image.toPNG())
  window.destroy()
  app.quit()
})
