import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initializeIdentity, getPrivateKeyHex, getUserAddress } from './crypto/identity'
import { getConnectedPeers, getNodeInfoSnapshot, startP2PNode, stopP2PNode } from './network/p2p'
import { AETHER_IDENTITY_GET_USER_ID, type GetUserIdResult } from '../types/identity-ipc'
import {
  AETHER_NETWORK_GET_CONNECTED_PEERS,
  AETHER_NETWORK_GET_NODE_INFO,
  type GetNodeInfoResult
} from '../types/network-ipc'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await initializeIdentity()

  const privateKeyHex = getPrivateKeyHex()
  if (privateKeyHex !== null) {
    await startP2PNode(privateKeyHex)
  }

  ipcMain.handle(AETHER_IDENTITY_GET_USER_ID, async (): Promise<GetUserIdResult> => {
    const address = getUserAddress()
    if (address !== null) {
      return { ok: true, userId: address }
    }
    return { ok: false }
  })

  ipcMain.handle(AETHER_NETWORK_GET_NODE_INFO, async (): Promise<GetNodeInfoResult> => {
    return getNodeInfoSnapshot()
  })

  ipcMain.handle(AETHER_NETWORK_GET_CONNECTED_PEERS, async (): Promise<string[]> => {
    return getConnectedPeers()
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

/** Корректная асинхронная остановка libp2p до выхода процесса (`will-quit` для await не подходит). */
let allowQuitAfterP2PStop = false
app.on('before-quit', async (e) => {
  if (allowQuitAfterP2PStop) {
    return
  }
  e.preventDefault()
  await stopP2PNode()
  allowQuitAfterP2PStop = true
  app.quit()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
