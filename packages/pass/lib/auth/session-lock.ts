import { api } from '@proton/pass/lib/api/api';
import { SessionLockStatus } from '@proton/pass/types';

export type SessionLockCheckResult = {
    status: SessionLockStatus;
    ttl?: number;
};

export const checkSessionLock = async (): Promise<SessionLockCheckResult> => {
    try {
        const { LockInfo } = await api({ url: 'pass/v1/user/session/lock/check', method: 'get' });
        return {
            status: LockInfo?.Exists ? SessionLockStatus.REGISTERED : SessionLockStatus.NONE,
            ttl: LockInfo?.UnlockedSecs ?? undefined,
        };
    } catch (e: any) {
        if (e?.name === 'LockedSession') return { status: SessionLockStatus.LOCKED };
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
