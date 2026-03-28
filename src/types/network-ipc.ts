/** IPC: сведения о локальном libp2p-узле (отладка). */
export const AETHER_NETWORK_GET_NODE_INFO = 'aether:network:getNodeInfo' as const

export type GetNodeInfoResult =
  | { status: 'ok'; peerId: string; multiaddrs: string[] }
  | { status: 'error' }

/** IPC: список PeerId активных соединений (см. {@link AETHER_NETWORK_GET_CONNECTED_PEERS}). */
export const AETHER_NETWORK_GET_CONNECTED_PEERS = 'aether:network:getConnectedPeers' as const
