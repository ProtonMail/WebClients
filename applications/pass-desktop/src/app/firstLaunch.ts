import { STORAGE_PREFIX } from '@proton/shared/lib/authentication/persistedSessionStorage';

export const FIRST_LAUNCH_KEY = 'pass::first_launch_complete';

export const dismissFirstLaunch = () => localStorage.setItem(FIRST_LAUNCH_KEY, '1');

export const isFirstLaunch = () => {
    if (localStorage.getItem(FIRST_LAUNCH_KEY) === '1') return false;

    if (Object.keys(localStorage).filter((key) => key.startsWith(STORAGE_PREFIX)).length > 0) {
        dismissFirstLaunch();
        return false;
    }

    return true;
};
