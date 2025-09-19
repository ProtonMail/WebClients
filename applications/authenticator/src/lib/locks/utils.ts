import { deobfuscate, obfuscate } from '@proton/pass/utils/obfuscate/xor';

export const LOCK_STATE_KEY = 'offline_state';
export const LOCK_MAX_FAILURES = 10;

export const getFailedAttemptCount = () => {
    const count = localStorage.getItem(LOCK_STATE_KEY);
    return count ? Number(deobfuscate(JSON.parse(count))) : null;
};

export const setFailedAttemptCount = (count: number) =>
    localStorage.setItem(LOCK_STATE_KEY, JSON.stringify(obfuscate(count.toString())));
