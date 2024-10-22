import Store from 'electron-store';

import type { StoreClipboardProperties } from './lib/clipboard';
import type { StoreInstallProperties } from './lib/install-info';
import type { StoreUpdateProperties } from './update';

export type RootStore = {
    installInfo?: StoreInstallProperties;
    update?: StoreUpdateProperties;
    clipboard?: StoreClipboardProperties;
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
    },
});
