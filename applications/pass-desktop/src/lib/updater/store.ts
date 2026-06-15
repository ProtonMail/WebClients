import { UpdateStatus } from '@proton/pass/types/desktop';
import type { UpdateStore } from '@proton/pass/types/desktop';

import config from '../../app/config';
import { store } from '../../store';
import { calculateUpdateDistribution } from './helpers';

export const getUpdateStore = (): UpdateStore => {
    const stored = store.get('update');
    return {
        distribution: stored?.distribution ?? calculateUpdateDistribution(),
        beta: stored?.beta ?? false,
        status: stored?.status ?? UpdateStatus.Idle,
        errorType: stored?.errorType ?? null,
        currentVersion: stored?.currentVersion ?? config.APP_VERSION,
        newVersion: stored?.newVersion ?? null,
        progress: stored?.progress ?? null,
        mockDoDownloadError: stored?.mockDoDownloadError ?? false,
    };
};

export const setUpdateStore = (update: Partial<UpdateStore>) => {
    const stored = getUpdateStore();
    const merged = { ...stored, ...update };
    if (merged.status !== UpdateStatus.Error && !('errorType' in update)) merged.errorType = null;
    store.set('update', merged);
};

export const onUpdateStore = (callback: (value: UpdateStore | undefined) => void) =>
    store.onDidChange('update', callback);

export const initUpdateStore = () => {
    // Create a distribution value only if there were none
    if (store.get('update')?.distribution == null) {
        setUpdateStore({ distribution: calculateUpdateDistribution() });
    }

    // Always reset current version and update status at boot
    setUpdateStore({
        currentVersion: config.APP_VERSION,
        status: UpdateStatus.Idle,
        newVersion: null,
        progress: null,
    });
};

export const isUpdateInProgress = () =>
    [UpdateStatus.Checking, UpdateStatus.Downloading].includes(getUpdateStore().status);
