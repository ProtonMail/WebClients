/** We're using a Proxy here to avoid loading the UI WASM file in
 * contexts where it should not live. This ensures that the PassUI
 * module is not executed in workers or content-scripts */
import type * as PassRustUI from '@protontech/pass-rust-core/ui';

import { isNativeJSError } from '@proton/pass/lib/core/utils';
import type { Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

type PassUIProxy = typeof PassRustUI;
let service: Maybe<PassUIProxy>;

const getPassUIModule = () =>
    BUILD_TARGET === 'safari'
        ? /** Safari extensions do not allow executing WASM directly on extension pages.
           * For all synchronous `@protontech/pass-rust-core/ui` operations, use asm.js. */
          import(/* webpackChunkName: "pass-ui" */ '@protontech/pass-rust-core/ui/proton_pass_web.asm')
        : import(/* webpackChunkName: "pass-ui" */ '@protontech/pass-rust-core/ui');

export const preloadPassUI = () => {
    if (service !== undefined || typeof window === 'undefined') return;

    return getPassUIModule()
        .then((value) => {
            service = value;
            logger.debug(`[PassCoreUI] Module v${value.library_version()} loaded`);
        })
        .catch((err) => logger.warn('[PassCoreUI] Failed loading module', err));
};

const PassUI = new Proxy<PassUIProxy>({} as any, {
    get(_, property) {
        /* In case the object gets serialized during error reporting */
        if (property === 'toJSON') return () => ({ __type: 'PassUIProxy' });
        if (property === Symbol.toStringTag) return 'PassUIProxy';

        return (...args: any[]) => {
            try {
                if (!service) throw new Error('`PassCoreUI` module not initialized');
                return (service[property as keyof PassUIProxy] as any)(...args);
            } catch (err) {
                if (isNativeJSError(err)) logger.warn(`[PassCoreUI] Failed executing ${property.toString()}`, err);
                throw err;
            }
        };
    },
});

export default PassUI;
