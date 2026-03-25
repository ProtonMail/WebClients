import { deobfuscate, obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { deserialize, serialize } from '@proton/pass/utils/object/serialize';

export const LOCK_STATE_KEY = 'offline_state';
export const LOCK_MAX_FAILURES = 10;

export const getFailedAttemptCount = () => {
    const count = localStorage.getItem(LOCK_STATE_KEY);
    return count ? Number(deobfuscate(deserialize(count))) : null;
};

export const setFailedAttemptCount = (count: number) =>
    localStorage.setItem(LOCK_STATE_KEY, serialize(obfuscate(count.toString())));
