import { AppStatus, type Maybe } from '@proton/pass/types';

export enum LockMode {
    /** Session API Lock with PIN code */
    SESSION = 'SESSION',
    /** Master Proton password lock with argon2 */
    PASSWORD = 'PASSWORD',
    /** OS-provided biometrics key */
    BIOMETRICS = 'BIOMETRICS',
    /** No locking mechanisms */
    NONE = 'NONE',
}

export const AppStatusFromLockMode = {
    [LockMode.SESSION]: AppStatus.SESSION_LOCKED,
    [LockMode.PASSWORD]: AppStatus.PASSWORD_LOCKED,
    [LockMode.BIOMETRICS]: AppStatus.BIOMETRICS_LOCKED,
    [LockMode.NONE]: AppStatus.IDLE,
};

export type Lock = { mode: LockMode; locked: boolean; ttl?: number };
export type LockCreateDTO = { mode: LockMode; secret: string; ttl: number; current?: { secret: string } };
export type UnlockDTO = { mode: LockMode; secret: string; offline: boolean };
export type LockOptions = { broadcast?: boolean; soft?: boolean };

export interface LockAdapter {
    type: LockMode;
    check: () => Promise<Lock>;
    create: (payload: LockCreateDTO, beforeCreate?: () => Promise<void>) => Promise<Lock>;
    delete: (secret: string) => Promise<Lock>;
    lock: (options: LockOptions) => Promise<Lock>;
    unlock: (secret: string) => Promise<Maybe<string>>;
}
