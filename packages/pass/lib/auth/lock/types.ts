import { AppStatus, type Maybe } from '@proton/pass/types';
import type { XorObfuscation } from '@proton/pass/utils/obfuscate/xor';

import type { biometricsLockAdapterFactory } from './biometrics/adapter';
import type { desktopLockAdapterFactory } from './desktop/adapter';
import type { passwordLockAdapterFactory } from './password/adapter';
import type { sessionLockAdapterFactory } from './session/adapter';

export enum LockMode {
    /** Session API Lock with PIN code */
    SESSION = 'SESSION',
    /** Master Proton password lock with argon2 */
    PASSWORD = 'PASSWORD',
    /** OS-provided biometrics key */
    BIOMETRICS = 'BIOMETRICS',
    /** Pass desktop app */
    DESKTOP = 'DESKTOP',
    /** No locking mechanisms */
    NONE = 'NONE',
}

export const AppStatusFromLockMode = {
    [LockMode.SESSION]: AppStatus.SESSION_LOCKED,
    [LockMode.PASSWORD]: AppStatus.PASSWORD_LOCKED,
    [LockMode.BIOMETRICS]: AppStatus.BIOMETRICS_LOCKED,
    [LockMode.DESKTOP]: AppStatus.DESKTOP_LOCKED,
    [LockMode.NONE]: AppStatus.IDLE,
};

export type Lock = { mode: LockMode; locked: boolean; ttl?: number };

export type UnlockDTO = { offline?: boolean } & (
    | { mode: LockMode.PASSWORD; password: XorObfuscation }
    | { mode: LockMode.SESSION; pin: string }
    | { mode: LockMode.BIOMETRICS; key: string }
    | { mode: LockMode.DESKTOP; key: string }
    | { mode: LockMode.NONE }
);

export type LockCreateDTO = { ttl: number; current?: UnlockDTO } & (
    | { mode: LockMode.PASSWORD; password: XorObfuscation }
    | { mode: LockMode.SESSION; pin: string }
    | { mode: LockMode.BIOMETRICS; password: XorObfuscation }
    | { mode: LockMode.DESKTOP; secret: string /** FIXME: needs to be `password` for offline support */ }
    | { mode: LockMode.NONE }
);

export type LockOptions = { broadcast?: boolean; soft?: boolean };

export interface LockAdapter<TCreate = string, TUnlock = TCreate> {
    type: LockMode;
    check: () => Promise<Lock>;
    create: (secret: TCreate, ttl: number, beforeCreate?: () => Promise<void>) => Promise<Lock>;
    delete: (secret: TUnlock) => Promise<Lock>;
    lock: (options: LockOptions) => Promise<Lock>;
    unlock: (secret: TUnlock) => Promise<Maybe<string>>;
}

export type LockAdapterMap = {
    [LockMode.BIOMETRICS]: ReturnType<typeof biometricsLockAdapterFactory>;
    [LockMode.PASSWORD]: ReturnType<typeof passwordLockAdapterFactory>;
    [LockMode.SESSION]: ReturnType<typeof sessionLockAdapterFactory>;
    [LockMode.DESKTOP]: ReturnType<typeof desktopLockAdapterFactory>;
    [LockMode.NONE]: never;
};
