import { api } from '@proton/pass/lib/api/api';
import { type Lock, LockMode } from '@proton/pass/lib/auth/lock/types';

export const checkSessionLock = async (): Promise<Lock> => {
    try {
        const { LockInfo } = await api({ url: 'pass/v1/user/session/lock/check', method: 'get' });
        return {
            mode: LockInfo?.Exists ? LockMode.SESSION : LockMode.NONE,
            locked: false,
            ttl: LockInfo?.UnlockedSecs ?? undefined,
        };
    } catch (e: any) {
        if (e?.name === 'LockedSession') return { mode: LockMode.SESSION, locked: true };
        throw e;
    }
};

export const forceSessionLock = async (): Promise<void> => {
    await api({
        url: 'pass/v1/user/session/lock/force_lock',
        method: 'post',
    });
};

export const createSessionLock = async (LockCode: string, UnlockedSecs: number): Promise<string> =>
    (
        await api({
            url: 'pass/v1/user/session/lock',
            method: 'post',
            data: { LockCode, UnlockedSecs },
        })
    ).LockData!.StorageToken;

export const deleteSessionLock = async (LockCode: string): Promise<string> =>
    (
        await api({
            url: 'pass/v1/user/session/lock',
            method: 'delete',
            data: { LockCode },
        })
    ).LockData!.StorageToken;

export const unlockSession = async (LockCode: string): Promise<string> =>
    (
        await api({
            url: 'pass/v1/user/session/lock/unlock',
            method: 'post',
            data: { LockCode },
        })
    ).LockData!.StorageToken;
