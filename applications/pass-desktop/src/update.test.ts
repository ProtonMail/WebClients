import { autoUpdater } from 'electron';

import { type FeatureFlagsResponse, PassFeature } from '@proton/pass/types/api/features';
import noop from '@proton/utils/noop';

import { msix_updater } from '../native';
import config from './app/config';
import { userAgent } from './lib/user-agent';
import { store } from './store';
import type { RemoteManifestResponse } from './update';
import { UPDATE_SOURCE_URL, checkForUpdates } from './update';
import { isMac, isWindows } from './utils/platform';

jest.mock('electron', () => ({
    app: { isPackaged: true, isReady: () => true },
    autoUpdater: { setFeedURL: jest.fn(), on: jest.fn(), checkForUpdates: jest.fn() },
}));

jest.mock('./utils/logger', () => ({ log: noop, debug: noop, info: noop, warn: noop, error: noop }));

jest.mock('./utils/platform', () => ({
    isMac: jest.fn(() => false),
    isWindows: jest.fn(() => false),
    isProdEnv: jest.fn(() => true),
}));

jest.mock('../native', () => ({
    msix_updater: { installUpdate: jest.fn() },
}));

const getMockSession = (version: RemoteManifestResponse, flags: FeatureFlagsResponse): any => ({
    fetch: async (url: string) => {
        let response: any = undefined;
        if (url.endsWith('version.json')) response = version;
        if (url.endsWith('feature/v2/frontend')) response = flags;
        return { json: () => response };
    },
});

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
        store.set('optInForBeta', false);
        jest.clearAllMocks();
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

    it('should ignore if there is are no new ones', async () => {
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
        store.set('optInForBeta', true);

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
        store.set('optInForBeta', true);

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
        (isMac as jest.Mock).mockImplementation(() => true);

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

        jest.clearAllMocks();

        // running in the same test to ensure it changes dynamically
        store.set('optInForBeta', true);

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
        (isWindows as jest.Mock).mockImplementation(() => true);

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
        expect(msix_updater.installUpdate).toHaveBeenCalledWith(url);
    });
});
