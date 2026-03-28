import { BaseWallet, Wallet } from 'ethers'
import { access, readFile, writeFile } from 'fs/promises'
import { constants } from 'fs'
import { join } from 'path'
import { app } from 'electron'

/**
 * Локальное хранилище идентичности: только приватный ключ (hex).
 * Адрес и публичный ключ восстанавливаются через `ethers.Wallet`.
 */
interface IdentityFilePayload {
  privateKey: string
}

type IdentityState =
  | { status: 'uninitialized' }
  | { status: 'ready'; wallet: BaseWallet }
  | { status: 'error' }

let identityState: IdentityState = { status: 'uninitialized' }

function isErrnoException(err: unknown): err is NodeJS.ErrnoException {
  return typeof err === 'object' && err !== null && 'code' in err
}

function isEnoent(err: unknown): boolean {
  return isErrnoException(err) && err.code === 'ENOENT'
}

/**
 * Парсит и проверяет `identity.json`. При невалидных данных бросает ошибку.
 */
function parseIdentityPayload(raw: string): IdentityFilePayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`identity.json не является корректным JSON: ${msg}`)
  }

  if (typeof parsed !== 'object' || parsed === null || !('privateKey' in parsed)) {
    throw new Error('identity.json: отсутствует поле privateKey')
  }

  const pk = (parsed as { privateKey: unknown }).privateKey
  if (typeof pk !== 'string') {
    throw new Error('identity.json: privateKey должен быть строкой')
  }

  try {
    new Wallet(pk)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`identity.json: недопустимый privateKey: ${msg}`)
  }

  return { privateKey: pk }
}

function getIdentityFilePath(): string {
  return join(app.getPath('userData'), 'identity.json')
}

/**
 * Загружает или создаёт криптоидентичность: ключи только в Main process.
 * При повреждённом файле пишет понятное сообщение в консоль и переводит состояние в `error`.
 */
export async function initializeIdentity(): Promise<void> {
  const filePath = getIdentityFilePath()

  try {
    await access(filePath, constants.F_OK)
  } catch (e) {
    if (isEnoent(e)) {
      await createNewIdentity(filePath)
      return
    }
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[Aether Identity] Не удалось проверить identity.json: ${msg}`)
    identityState = { status: 'error' }
    return
  }

  let raw: string
  try {
    raw = await readFile(filePath, 'utf-8')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[Aether Identity] Не удалось прочитать identity.json: ${msg}`)
    identityState = { status: 'error' }
    return
  }

  let payload: IdentityFilePayload
  try {
    payload = parseIdentityPayload(raw)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(
      `[Aether Identity] Файл identity.json повреждён или имеет неверный формат: ${msg}`
    )
    identityState = { status: 'error' }
    return
  }

  const wallet = new Wallet(payload.privateKey)
  identityState = { status: 'ready', wallet }
}

/**
 * Создаёт новую пару ключей и атомарно сохраняет приватный ключ на диск (async I/O).
 */
async function createNewIdentity(filePath: string): Promise<void> {
  const wallet = Wallet.createRandom()
  const body: IdentityFilePayload = { privateKey: wallet.privateKey }
  const json = `${JSON.stringify(body, null, 2)}\n`

  try {
    await writeFile(filePath, json, 'utf-8')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[Aether Identity] Не удалось записать identity.json: ${msg}`)
    identityState = { status: 'error' }
    return
  }

  identityState = { status: 'ready', wallet }
}

/**
 * Ethereum-адрес (User ID) для UI. Только если идентичность успешно загружена.
 */
export function getUserAddress(): string | null {
  if (identityState.status !== 'ready') {
    return null
  }
  return identityState.wallet.address
}

/**
 * Приватный ключ кошелька (hex, с `0x`). Только Main process; не передавать в renderer.
 */
export function getPrivateKeyHex(): string | null {
  if (identityState.status !== 'ready') {
    return null
  }
  return identityState.wallet.privateKey
}

/**
 * Сырой публичный ключ (hex), например для будущего libp2p / подписей вне Ethereum.
 * Не передаётся в renderer.
 */
export function getPublicKeyHex(): string | null {
  if (identityState.status !== 'ready') {
    return null
  }
  return identityState.wallet.signingKey.publicKey
}
