import { UpdateStatus } from '@proton/pass/types/desktop';
import type { UpdateStore } from '@proton/pass/types/desktop';

import config from '../../app/config';
import { ARCH } from '../../lib/env';
import { store } from '../../store';
import { isProdEnv } from '../../utils/platform';
import { calculateUpdateDistribution } from './helpers';

const DOWNLOAD_ROOT = 'https://proton.me/download';
const UPDATE_PATH = `PassDesktop/${process.platform}/${ARCH}`;
export const UPDATE_SOURCE_URL = `${DOWNLOAD_ROOT}/${UPDATE_PATH}`;
const ALLOW_MOCK_UPDATE = !isProdEnv() || Boolean(process.env.PASS_DEBUG);

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
        // Mock fields are forced to safe defaults unless mocking is allowed, so a value persisted
        // during a PASS_DEBUG session can never take effect in a later prod-mode launch.
        mockUpdateBaseUrl: ALLOW_MOCK_UPDATE ? (stored?.mockUpdateBaseUrl ?? null) : null,
        mockDownload: ALLOW_MOCK_UPDATE ? (stored?.mockDownload ?? !isProdEnv()) : false,
        mockDoDownloadError: ALLOW_MOCK_UPDATE ? (stored?.mockDoDownloadError ?? false) : false,
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

    // Always reset current version, update status and debug/mock overrides at boot
    setUpdateStore({
        currentVersion: config.APP_VERSION,
        status: UpdateStatus.Idle,
        newVersion: null,
        progress: null,
        mockUpdateBaseUrl: null,
        mockDownload: !isProdEnv(),
        mockDoDownloadError: false,
    });
};

export const isUpdateInProgress = () =>
    [UpdateStatus.Checking, UpdateStatus.Downloading].includes(getUpdateStore().status);

export const getUpdateBaseUrl = () => {
    // Outside a mocking-allowed context, never even read the persisted override.
    if (!ALLOW_MOCK_UPDATE) return UPDATE_SOURCE_URL;
    // mockUpdateBaseUrl is the server root; the PassDesktop/{platform}/{arch} path is appended.
    const { mockUpdateBaseUrl } = getUpdateStore();
    if (!mockUpdateBaseUrl) return UPDATE_SOURCE_URL;
    return `${mockUpdateBaseUrl.replace(/\/$/, '')}/${UPDATE_PATH}`;
};
