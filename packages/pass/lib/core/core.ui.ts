/** We're using a Proxy here to avoid loading the UI WASM file in
 * contexts where it should not live. This ensures that the PassUI
 * module is not executed in workers or content-scripts */
import type PassRustUI from '@protontech/pass-rust-core/ui';

import type { Maybe } from '@proton/pass/types';

type PassUI = typeof PassRustUI;
let service: Maybe<PassUI>;

export const preloadPassCoreUI = () => {
    if (service !== undefined || typeof window === 'undefined') return;
    return import(/* webpackChunkName: "pass-core.ui" */ '@protontech/pass-rust-core/ui')
        .then((value) => (service = value))
        .catch((err) => console.warn('[PassCore::UI] Failed loading module', err));
};

export default new Proxy<PassUI>({} as any, {
    get(_, property: keyof PassUI) {
        return (...args: any[]) => {
            if (!service) throw new Error('PassUI not initialized');
            (service[property] as any)(...args);
        };
    },
});
