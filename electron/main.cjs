const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')

let mainWindow

function sendCommand(command) {
  mainWindow?.webContents.send('menu:command', command)
}

function createMenu() {
  const isMac = process.platform === 'darwin'
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: '文件',
      submenu: [
        { label: '新建', accelerator: 'CmdOrCtrl+N', click: () => sendCommand('new') },
        { label: '打开工程...', accelerator: 'CmdOrCtrl+O', click: () => sendCommand('open') },
        { type: 'separator' },
        { label: '保存', accelerator: 'CmdOrCtrl+S', click: () => sendCommand('save') },
        { label: '另存为...', accelerator: 'CmdOrCtrl+Shift+S', click: () => sendCommand('save-as') },
        { type: 'separator' },
        { label: '导入 XML...', click: () => sendCommand('import-xml') },
        { label: '导出 XML...', accelerator: 'CmdOrCtrl+E', click: () => sendCommand('export-xml') },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: '退出' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', click: () => sendCommand('undo') },
        { label: '重做', accelerator: 'CmdOrCtrl+Shift+Z', click: () => sendCommand('redo') },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '自动布局', accelerator: 'CmdOrCtrl+L', click: () => sendCommand('layout') },
        { label: '适应画布', accelerator: 'F', click: () => sendCommand('fit') },
        { type: 'separator' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'togglefullscreen', label: '全屏' },
        ...(!app.isPackaged ? [{ role: 'toggleDevTools', label: '开发者工具' }] : []),
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1050,
    minHeight: 680,
    backgroundColor: '#111418',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  } else {
    mainWindow.loadURL('http://127.0.0.1:5173')
  }
}

ipcMain.handle('file:open-text', async (_event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options.filters || [{ name: 'All files', extensions: ['*'] }],
  })
  if (result.canceled || !result.filePaths[0]) return null
  const filePath = result.filePaths[0]
  return { path: filePath, content: await fs.readFile(filePath, 'utf8') }
})

ipcMain.handle('file:save-text', async (_event, options = {}) => {
  let filePath = options.path
  if (!filePath || options.prompt) {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: options.defaultPath,
      filters: options.filters || [{ name: 'All files', extensions: ['*'] }],
    })
    if (result.canceled || !result.filePath) return null
    filePath = result.filePath
  }
  await fs.writeFile(filePath, options.content || '', 'utf8')
  return { path: filePath }
})

app.whenReady().then(() => {
  createMenu()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
