import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { keys } from '@libp2p/crypto'
import { mdns } from '@libp2p/mdns'
import { tcp } from '@libp2p/tcp'
import { webSockets } from '@libp2p/websockets'
import { getBytes } from 'ethers'
import { createLibp2p, type Libp2p } from 'libp2p'

import type { GetNodeInfoResult } from '../../types/network-ipc'

/** Прослушивание TCP и WebSocket на всех интерфейсах, порты выбирает ОС (`/tcp/0`). */
const LISTEN_ADDRS = ['/ip4/0.0.0.0/tcp/0', '/ip4/0.0.0.0/tcp/0/ws'] as const

let p2pNode: Libp2p | null = null
let startFailed = false

function attachPeerLifecycleTracking(node: Libp2p): void {
  node.addEventListener('peer:connect', (evt) => {
    console.log(`[Aether P2P] peer:connect ${evt.detail.toString()}`)
  })

  node.addEventListener('peer:disconnect', (evt) => {
    console.log(`[Aether P2P] peer:disconnect ${evt.detail.toString()}`)
  })
}

/**
 * На ответ mDNS пытаемся установить соединение (иначе узел только «видит», но не подключается).
 */
function attachMdnsDialing(node: Libp2p): void {
  node.addEventListener('peer:discovery', (evt) => {
    const { id, multiaddrs } = evt.detail
    if (id.equals(node.peerId) || multiaddrs.length === 0) {
      return
    }
    void node.dial(multiaddrs).catch(() => {
      // Гонка адресов / файрвол — нормальная ситуация для LAN
    })
  })
}

/**
 * Поднимает libp2p-узел с тем же secp256k1-ключом, что и кошелёк ethers:
 * приватный ключ → сырой 32 байта → {@link keys.privateKeyFromRaw} → {@link createLibp2p}.
 *
 * `createFromPrivKey` из peer-id-factory не вызываем: в одном бандле с `@libp2p/crypto@5` даёт конфликт версий protobuf/crypto.
 */
export async function startP2PNode(privateKeyHex: string): Promise<void> {
  if (p2pNode !== null) {
    return
  }
  if (startFailed) {
    return
  }

  try {
    const raw = getBytes(privateKeyHex)
    const privateKey = keys.privateKeyFromRaw(raw)

    p2pNode = await createLibp2p({
      privateKey,
      addresses: {
        listen: [...LISTEN_ADDRS]
      },
      transports: [tcp(), webSockets()],
      streamMuxers: [yamux()],
      connectionEncrypters: [noise()],
      peerDiscovery: [mdns()]
    })

    attachPeerLifecycleTracking(p2pNode)
    attachMdnsDialing(p2pNode)
  } catch (err) {
    startFailed = true
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[Aether P2P] Не удалось запустить узел: ${msg}`)
  }
}

/**
 * Останавливает libp2p (слушатели и соединения). Безопасно вызывать при `null`.
 */
export async function stopP2PNode(): Promise<void> {
  if (p2pNode === null) {
    return
  }
  try {
    await p2pNode.stop()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[Aether P2P] Ошибка при остановке узла: ${msg}`)
  } finally {
    p2pNode = null
  }
}

/**
 * Данные для IPC: PeerId и локальные multiaddr слушателей.
 */
export function getNodeInfoSnapshot(): GetNodeInfoResult {
  if (p2pNode === null || startFailed) {
    return { status: 'error' }
  }
  const peerId = p2pNode.peerId.toString()
  const multiaddrs = p2pNode.getMultiaddrs().map((ma) => ma.toString())
  return { status: 'ok', peerId, multiaddrs }
}

/**
 * Уникальные PeerId активных соединений (удалённые пиры, без локального узла).
 */
export function getConnectedPeers(): string[] {
  if (p2pNode === null || startFailed) {
    return []
  }
  const local = p2pNode.peerId
  return p2pNode
    .getPeers()
    .filter((p) => !p.equals(local))
    .map((p) => p.toString())
    .sort()
}
