import { builtinModules } from 'node:module'
import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Только Electron и встроенные модули Node — всё остальное (libp2p, pure ESM) бандлим в main. */
const MAIN_EXTERNAL = new Set<string>([
  'electron',
  ...builtinModules,
  ...builtinModules.flatMap((m) => `node:${m}` as const)
])

export default defineConfig({
  main: {
    build: {
      externalizeDeps: false,
      commonjsOptions: {
        transformMixedEsModules: true
      },
      rollupOptions: {
        external(source) {
          return MAIN_EXTERNAL.has(source) || source.startsWith('electron/')
        }
      }
    },
    ssr: {
      noExternal: [
        /^@libp2p\//,
        /^@chainsafe\//,
        /^libp2p$/,
        /^uint8arrays$/,
        /^uint8arraylist$/,
        /^it-.*$/,
        /^@multiformats\//,
        /^multiformats$/,
        /^@noble\//,
        /^protons-runtime$/,
        /^protons$/,
        /^interface-.*$/,
        /^main-event$/,
        /^progress-events$/,
        /^ethers$/,
        /^@ethersproject\//
      ]
    }
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [tailwindcss(), react()]
  }
})
