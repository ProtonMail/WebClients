/** We're using a Proxy here to avoid loading the UI WASM file in
 * contexts where it should not live. This ensures that the PassUI
 * module is not executed in workers or content-scripts */
import type PassRustUI from '@protontech/pass-rust-core/ui';

import { isNativeJSError } from '@proton/pass/lib/core/utils';
import type { Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

type PassUI = typeof PassRustUI;
let service: Maybe<PassUI>;

const getUIModule = () =>
    BUILD_TARGET === 'safari'
        ? import(/* webpackChunkName: "pass-core.ui" */ './asm/ui/proton_pass_web.asm')
        : import(/* webpackChunkName: "pass-core.ui" */ '@protontech/pass-rust-core/ui');

export const preloadPassCoreUI = () => {
    if (service !== undefined || typeof window === 'undefined') return;

    return getUIModule()
        .then((value) => {
            service = value;
            logger.debug(`[PassCoreUI] Module v${value.library_version()} loaded`);
        })
        .catch((err) => logger.warn('[PassCoreUI] Failed loading module', err));
};

export default new Proxy<PassUI>({} as any, {
    get(_, property) {
        /* In case the object gets serialized during error reporting */
        if (property === 'toJSON') return () => ({ __type: 'PassUIProxy' });
        if (property === Symbol.toStringTag) return 'PassUIProxy';

        return (...args: any[]) => {
            try {
                if (!service) throw new Error('Module not initialized');
                return (service[property as keyof PassUI] as any)(...args);
            } catch (err) {
                if (isNativeJSError(err)) logger.warn(`[PassCoreUI] Failed executing ${property.toString()}`, err);
                throw err;
            }
        };
    },
});
