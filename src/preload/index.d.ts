import { ElectronAPI } from '@electron-toolkit/preload'
import type { GetUserIdResult } from '../types/identity-ipc'
import type { GetNodeInfoResult } from '../types/network-ipc'

export interface AetherApi {
  getUserId: () => Promise<GetUserIdResult>
  getNodeInfo: () => Promise<GetNodeInfoResult>
  getConnectedPeers: () => Promise<string[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AetherApi
  }
}
