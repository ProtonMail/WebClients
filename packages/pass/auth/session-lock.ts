import { api } from '../api';
import { type MaybeNull, SessionLockStatus } from '../types';

export type SessionLockCheckResult = {
    status: MaybeNull<SessionLockStatus>;
    ttl?: MaybeNull<number>;
};

export const checkSessionLock = async (): Promise<SessionLockCheckResult> => {
    try {
        const { LockInfo } = await api({ url: 'pass/v1/user/session/lock/check', method: 'get' });
        return {
            status: LockInfo?.Exists ? SessionLockStatus.REGISTERED : null,
            ttl: LockInfo?.UnlockedSecs,
        };
    } catch (e: any) {
        if (e?.name === 'LockedSession') {
            return { status: SessionLockStatus.LOCKED };
        }

        throw e;
    }
};

export const lockSessionImmediate = async (): Promise<void> => {
    await api({
        url: 'pass/v1/user/session/lock/force_lock',
        method: 'post',
    });
};

export const lockSession = async (LockCode: string, UnlockedSecs: number): Promise<string> =>
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
