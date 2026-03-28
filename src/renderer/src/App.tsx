import { useEffect, useState } from 'react'

import type { GetNodeInfoResult } from '../../types/network-ipc'

type ProfileState = { status: 'loading' } | { status: 'ok'; userId: string } | { status: 'error' }

function truncateMiddle(value: string, headChars: number, tailChars: number): string {
  if (value.length <= headChars + tailChars + 1) {
    return value
  }
  return `${value.slice(0, headChars)}…${value.slice(-tailChars)}`
}

function App(): React.JSX.Element {
  const [profile, setProfile] = useState<ProfileState>({ status: 'loading' })
  const [nodeInfo, setNodeInfo] = useState<GetNodeInfoResult | null>(null)
  const [connectedPeers, setConnectedPeers] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    void window.api.getUserId().then((result) => {
      if (cancelled) return
      if (result.ok) {
        setProfile({ status: 'ok', userId: result.userId })
      } else {
        setProfile({ status: 'error' })
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (profile.status !== 'ok') {
      return
    }
    let cancelled = false
    void window.api.getNodeInfo().then((info) => {
      if (!cancelled) setNodeInfo(info)
    })
    return () => {
      cancelled = true
    }
  }, [profile])

  useEffect(() => {
    if (profile.status !== 'ok') {
      return
    }
    const poll = (): void => {
      void window.api.getConnectedPeers().then(setConnectedPeers)
    }
    poll()
    const id = window.setInterval(poll, 3_000)
    return () => window.clearInterval(id)
  }, [profile.status])

  if (profile.status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Загрузка…
      </div>
    )
  }

  if (profile.status === 'error') {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-red-400">
        Ошибка загрузки профиля
      </div>
    )
  }

  const networkOnline = nodeInfo?.status === 'ok'
  const localPeerId = nodeInfo?.status === 'ok' ? nodeInfo.peerId : null
  const displayUserId = truncateMiddle(profile.userId, 8, 6)
  const displayPeerId = localPeerId ? truncateMiddle(localPeerId, 10, 8) : '—'

  return (
    <div className="flex h-screen flex-row overflow-hidden bg-zinc-950 text-zinc-100">
      <aside className="flex w-80 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 p-4">
        <section className="mb-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Мой профиль
          </h2>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-zinc-500">User ID</p>
              <p className="cursor-default truncate font-mono text-zinc-200" title={profile.userId}>
                {displayUserId}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">PeerId</p>
              <p
                className="cursor-default truncate font-mono text-zinc-200"
                title={localPeerId ?? undefined}
              >
                {displayPeerId}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Сеть</h2>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${networkOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-zinc-600'}`}
              aria-hidden
            />
            <span className="text-zinc-200">{networkOnline ? 'Online' : 'Offline'}</span>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
          <h2 className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Пиры рядом
          </h2>
          <div className="min-h-0 flex-1 overflow-y-auto text-sm">
            {connectedPeers.length === 0 ? (
              <p className="text-zinc-500 leading-relaxed">Идет поиск в локальной сети…</p>
            ) : (
              <ul className="space-y-2">
                {connectedPeers.map((id) => (
                  <li key={id}>
                    <div
                      className="rounded-lg bg-zinc-800/70 px-3 py-2 font-mono text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
                      title={id}
                    >
                      {truncateMiddle(id, 12, 10)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-zinc-900">
        <div className="flex flex-1 items-center justify-center p-8">
          <p className="max-w-md text-center text-base text-zinc-500 leading-relaxed">
            Выберите пира из списка слева для начала общения
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
