import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { AETHER_IDENTITY_GET_USER_ID, type GetUserIdResult } from '../types/identity-ipc'
import {
  AETHER_NETWORK_GET_CONNECTED_PEERS,
  AETHER_NETWORK_GET_NODE_INFO,
  type GetNodeInfoResult
} from '../types/network-ipc'

const api = {
  getUserId: (): Promise<GetUserIdResult> => ipcRenderer.invoke(AETHER_IDENTITY_GET_USER_ID),
  getNodeInfo: (): Promise<GetNodeInfoResult> => ipcRenderer.invoke(AETHER_NETWORK_GET_NODE_INFO),
  getConnectedPeers: (): Promise<string[]> => ipcRenderer.invoke(AETHER_NETWORK_GET_CONNECTED_PEERS)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
