/** IPC channel: main ↔ renderer для запроса Ethereum-адреса (User ID). */
export const AETHER_IDENTITY_GET_USER_ID = 'aether:identity:getUserId' as const

/** Результат вызова {@link AETHER_IDENTITY_GET_USER_ID}: успех с адресом или ошибка инициализации. */
export type GetUserIdResult = { ok: true; userId: string } | { ok: false }
