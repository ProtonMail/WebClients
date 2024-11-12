import Store from 'electron-store';

import type { ClipboardStoreProperties } from '@proton/pass/types';

import type { StoreInstallProperties } from './lib/install-info';
import type { StoreUpdateProperties } from './update';

type RootStore = {
    installInfo?: StoreInstallProperties;
    update?: StoreUpdateProperties;
    clipboard?: ClipboardStoreProperties;
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
