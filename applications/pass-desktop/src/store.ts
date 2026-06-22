import Store from 'electron-store';

import type { DesktopTheme, UpdateStore } from '@proton/pass/types';

import config from './app/config';
import type { StoreInstallProperties } from './lib/install-info';
import { calculateUpdateDistribution } from './lib/updater/helpers';
import type { WindowConfigStoreProperties } from './lib/window-management';

type RootStore = {
    installInfo?: StoreInstallProperties;
    update?: UpdateStore;
    theme?: DesktopTheme;
    windowConfig?: WindowConfigStoreProperties;
};

export const store = new Store<RootStore>({
    accessPropertiesByDotNotation: false,
    clearInvalidConfig: true,
    migrations: {
        '>=1.25.0': (s) => {
            const distribution = s.get('update.distribution');
            if (!distribution || typeof distribution !== 'number') return;
            s.set('update', { distribution });
        },
        '>=1.38.0': (s) => {
            const existing = s.get('update');
            const beta = existing?.beta ?? s.get('optInForBeta') === true;
            const distribution = existing?.distribution ?? calculateUpdateDistribution();
            s.set<'update'>('update', {
                distribution,
                beta,
                status: 0,
                errorType: null,
                currentVersion: config.APP_VERSION,
                newVersion: null,
                progress: null,
                mockUpdateBaseUrl: null,
                mockDownload: false,
                mockDoDownloadError: false,
            });
            s.delete('optInForBeta' as any);
        },
    },
});
