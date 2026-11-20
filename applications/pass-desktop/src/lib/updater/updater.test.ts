import { autoUpdater } from 'electron';

import { type FeatureFlagsResponse, PassFeature } from '@proton/pass/types/api/features';
import { UpdateStatus } from '@proton/pass/types/desktop';

import { msix_updater } from 'proton-pass-desktop-native';

import config from '../../app/config';
import { store } from '../../store';
import { isLinux, isMac, isProdEnv, isWindows } from '../../utils/platform';
import { userAgent } from '../user-agent';
import { UPDATE_SOURCE_URL, getUpdateStore, setUpdateStore } from './store';
import type { RemoteManifestResponse } from './updater';
import { checkForUpdates } from './updater';

vi.mock('electron', () => ({
    app: { isPackaged: true, isReady: () => true },
    autoUpdater: { setFeedURL: vi.fn(), on: vi.fn(), checkForUpdates: vi.fn() },
}));

vi.mock('../../utils/logger', () => {
    const noop = () => {};
    return { default: { log: noop, debug: noop, info: noop, warn: noop, error: noop } };
});

vi.mock('../../store', () => {
    const data = new Map<string, unknown>();
    return {
        store: {
            get: (key: string) => data.get(key),
            set: (key: string, value: unknown) => {
                data.set(key, value);
            },
            delete: (key: string) => {
                data.delete(key);
            },
            clear: () => data.clear(),
            onDidChange: () => () => {},
        },
    };
});

vi.mock('../env', () => ({ ARCH: 'universal' }));

vi.mock('../../utils/platform', () => ({
    isMac: vi.fn(() => false),
    isWindows: vi.fn(() => false),
    isLinux: vi.fn(() => false),
    isProdEnv: vi.fn(() => true),
}));

vi.mock('proton-pass-desktop-native', () => ({
    msix_updater: { installUpdate: vi.fn() },
}));

const getMockSession = (version: RemoteManifestResponse, flags: FeatureFlagsResponse): any => ({
    fetch: async (url: string) => {
        let response: any = undefined;
        if (url.endsWith('version.json')) response = version;
        if (url.endsWith('feature/v2/frontend')) response = flags;
        return { json: () => response };
    },
});

const setOs = (os: 'windows' | 'macos' | 'linux') => {
    vi.mocked(isMac).mockImplementation(() => os === 'macos');
    vi.mocked(isWindows).mockImplementation(() => os === 'windows');
    vi.mocked(isLinux).mockImplementation(() => os === 'linux');
};

const check = async (versions: RemoteManifestResponse['Releases'], featureFlag = true) => {
    config.APP_VERSION = '1.0.0';

    const mockVersion: RemoteManifestResponse = { Releases: versions };
    const mockFlags: FeatureFlagsResponse = {
        Code: 200,
        toggles: featureFlag
            ? [{ name: PassFeature.PassEnableDesktopAutoUpdate, variant: { name: '', enabled: true, payload: null } }]
            : [],
    };

    return checkForUpdates(getMockSession(mockVersion, mockFlags));
};

describe('Electron updater', () => {
    beforeEach(() => {
        store.set('update', { beta: false, distribution: 0, status: UpdateStatus.Idle, newVersion: null });
        vi.mocked(isProdEnv).mockImplementation(() => true);
        vi.clearAllMocks();

        // Default to macos version
        setOs('macos');
    });

    it('should update if there is a new one', async () => {
        const update = await check([
            {
                Version: '1.1.0',
                RolloutPercentage: 1.0,
                CategoryName: 'Stable',
                File: [],
            },
        ]);

        expect(update).toBe(true);
        expect(autoUpdater.checkForUpdates).toHaveBeenCalled();
    });

    it('should ignore if there are no new ones', async () => {
        const update = await check([
            {
                Version: '1.0.0',
                RolloutPercentage: 1.0,
                CategoryName: 'Stable',
                File: [],
            },
        ]);

        expect(update).toBe(false);
        expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled();
    });

    it('should update if list is not sorted', async () => {
        const update = await check([
            {
                Version: '1.0.0',
                RolloutPercentage: 1.0,
                CategoryName: 'Stable',
                File: [],
            },
            {
                Version: '1.1.0',
                RolloutPercentage: 1.0,
                CategoryName: 'Stable',
                File: [],
            },
        ]);

        expect(update).toBe(true);
        expect(autoUpdater.checkForUpdates).toHaveBeenCalled();
    });

    it('should ignore non Stable versions by default', async () => {
        const update = await check([
            {
                Version: '1.0.0',
                RolloutPercentage: 1.0,
                CategoryName: 'Stable',
                File: [],
            },
            {
                Version: '1.1.0',
                RolloutPercentage: 1.0,
                CategoryName: 'Beta',
                File: [],
            },
        ]);

        expect(update).toBe(false);
        expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled();
    });

    it('should ignore if outside rollout percentage', async () => {
        store.set('update', { distribution: 0.9 });

        const update = await check([
            {
                Version: '1.1.0',
                RolloutPercentage: 0.5,
                CategoryName: 'Stable',
                File: [],
            },
        ]);

        expect(update).toBe(false);
        expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled();
    });

    it('should update if inside rollout percentage', async () => {
        store.set('update', { distribution: 0.1 });

        const update = await check([
            {
                Version: '1.1.0',
                RolloutPercentage: 0.5,
                CategoryName: 'Stable',
                File: [],
            },
        ]);

        expect(update).toBe(true);
        expect(autoUpdater.checkForUpdates).toHaveBeenCalled();
    });

    it('should update if opt in for beta and last Stable is newer', async () => {
        store.set('update', { beta: true });

        const update = await check([
            {
                Version: '1.1.0',
                RolloutPercentage: 1.0,
                CategoryName: 'Stable',
                File: [],
            },
        ]);

        expect(update).toBe(true);
        expect(autoUpdater.checkForUpdates).toHaveBeenCalled();
    });

    it('should update if opt in for beta and last Beta is newer', async () => {
        store.set('update', { beta: true });

        const update = await check([
            {
                Version: '1.1.0',
                RolloutPercentage: 1.0,
                CategoryName: 'Beta',
                File: [],
            },
        ]);

        expect(update).toBe(true);
        expect(autoUpdater.checkForUpdates).toHaveBeenCalled();
    });

    it('should ignore EarlyAccess entirely (they may be some left)', async () => {
        const update = await check([
            {
                Version: '1.1.0',
                RolloutPercentage: 1.0,
                CategoryName: 'EarlyAccess' as any,
                File: [],
            },
            {
                Version: '1.0.0',
                RolloutPercentage: 1.0,
                CategoryName: 'Stable',
                File: [],
            },
        ]);

        expect(update).toBe(false);
        expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled();
    });

    it('should ignore if feature flag is off', async () => {
        const update = await check(
            [
                {
                    Version: '1.1.0',
                    RolloutPercentage: 1.0,
                    CategoryName: 'Stable',
                    File: [],
                },
            ],
            false
        );

        expect(update).toBe(false);
        expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled();
    });

    it('should update feed url on mac depending on the beta settings', async () => {
        await check([
            {
                Version: '1.1.0',
                RolloutPercentage: 1.0,
                CategoryName: 'Stable',
                File: [],
            },
        ]);

        expect(autoUpdater.setFeedURL).toHaveBeenCalledWith({
            headers: { 'user-agent': userAgent() },
            serverType: 'json',
            url: `${UPDATE_SOURCE_URL}/RELEASES.json`,
        });

        vi.clearAllMocks();

        // running in the same test to ensure it changes dynamically
        store.set('update', { beta: true });

        await check([
            {
                Version: '1.1.0',
                RolloutPercentage: 1.0,
                CategoryName: 'Stable',
                File: [],
            },
        ]);

        expect(autoUpdater.setFeedURL).toHaveBeenCalledWith({
            headers: { 'user-agent': userAgent() },
            serverType: 'json',
            url: `${UPDATE_SOURCE_URL}/beta/RELEASES.json`,
        });
    });

    it('should use native windows binding to trigger updates on windows', async () => {
        setOs('windows');

        const url = 'url';

        const update = await check([
            {
                Version: '1.1.0',
                RolloutPercentage: 1.0,
                CategoryName: 'Stable',
                File: [{ Url: url }],
            },
        ]);

        expect(update).toBe(true);
        expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled();
        expect(msix_updater.installUpdate).toHaveBeenCalledWith(url, expect.any(Function));
    });

    describe('status updates', () => {
        it('should reset status to Idle when no update available', async () => {
            await check([{ Version: '1.0.0', RolloutPercentage: 1.0, CategoryName: 'Stable', File: [] }]);
            expect(getUpdateStore().status).toBe(UpdateStatus.Idle);
        });

        it('should reset status to Idle when outside rollout percentage', async () => {
            store.set('update', { distribution: 0.9 });
            await check([{ Version: '1.1.0', RolloutPercentage: 0.5, CategoryName: 'Stable', File: [] }]);
            expect(getUpdateStore().status).toBe(UpdateStatus.Idle);
        });

        it('should reset status to Idle when feature flag is off', async () => {
            await check([{ Version: '1.1.0', RolloutPercentage: 1.0, CategoryName: 'Stable', File: [] }], false);
            expect(getUpdateStore().status).toBe(UpdateStatus.Idle);
        });

        it('should set status to UpdateReady when update is available', async () => {
            vi.mocked(autoUpdater.checkForUpdates).mockImplementation(() => {
                setUpdateStore({ status: UpdateStatus.UpdateReady });
            });
            await check([{ Version: '1.1.0', RolloutPercentage: 1.0, CategoryName: 'Stable', File: [] }]);
            expect(getUpdateStore().status).toBe(UpdateStatus.UpdateReady);
        });

        it('should set status to UpdateReady on windows after install', async () => {
            setOs('windows');
            await check([{ Version: '1.1.0', RolloutPercentage: 1.0, CategoryName: 'Stable', File: [{ Url: 'url' }] }]);
            expect(getUpdateStore().status).toBe(UpdateStatus.UpdateReady);
        });

        it('should re-check and supersede a staged update when a newer one is available', async () => {
            // Download staged but not yet installed: a re-check (eg. after toggling beta) must still run
            store.set('update', { status: UpdateStatus.UpdateReady });
            vi.mocked(autoUpdater.checkForUpdates).mockImplementation(() => {
                setUpdateStore({ status: UpdateStatus.UpdateReady });
            });

            const update = await check([
                {
                    Version: '1.1.0',
                    RolloutPercentage: 1.0,
                    CategoryName: 'Stable',
                    File: [],
                },
            ]);

            expect(update).toBe(true);
            expect(autoUpdater.checkForUpdates).toHaveBeenCalled();
        });

        it('should keep the staged update when a re-check finds nothing newer', async () => {
            store.set('update', { status: UpdateStatus.UpdateReady });

            const update = await check([
                {
                    Version: '1.0.0',
                    RolloutPercentage: 1.0,
                    CategoryName: 'Stable',
                    File: [],
                },
            ]);

            expect(update).toBe(false);
            expect(getUpdateStore().status).toBe(UpdateStatus.UpdateReady);
            expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled();
        });

        it('should skip check while a download is in progress', async () => {
            store.set('update', { status: UpdateStatus.Downloading });

            const update = await check([
                {
                    Version: '1.1.0',
                    RolloutPercentage: 1.0,
                    CategoryName: 'Stable',
                    File: [],
                },
            ]);

            expect(update).toBe(false);
            expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled();
        });
    });
});
