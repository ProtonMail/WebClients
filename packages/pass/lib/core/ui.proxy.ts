/** We're using a Proxy here to avoid loading the UI WASM file in
 * contexts where it should not live. This ensures that the PassUI
 * module is not executed in workers or content-scripts */
import type * as PassRustUI from '@protontech/pass-rust-core/ui';

import type { PassUIMethod, PassUIParams, PassUIProxy } from '@proton/pass/lib/core/ui.types';
import { PassUIWorkerService } from '@proton/pass/lib/core/ui.worker.service';
import { isNativeJSError } from '@proton/pass/lib/core/utils';
import type { Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

let service: Maybe<typeof PassRustUI>;

export const preloadPassUI =
    BUILD_TARGET === 'safari'
        ? async () => Promise.resolve()
        : async () => {
              if (service !== undefined || typeof window === 'undefined') return;

              return import(/* webpackChunkName: "pass-ui" */ '@protontech/pass-rust-core/ui')
                  .then((value) => {
                      service = value;
                      logger.debug(`[PassUI] Module v${value.library_version()} loaded`);
                  })
                  .catch((err) => logger.warn('[PassCoreUI] Failed loading module', err));
          };

const createPassUIWorkerProxy = () =>
    new Proxy<PassUIProxy>({} as any, {
        get(_, property) {
            if (property === 'toJSON') return () => ({ __type: 'PassUIWorkerProxy' });
            if (property === Symbol.toStringTag) return 'PassUIWorkerProxy';

            return (...args: any[]) => {
                switch (property) {
                    case 'mime_type_from_content':
                        const content = (args as PassUIParams<'mime_type_from_content'>)[0];
                        return PassUIWorkerService.transfer([content.buffer])('mime_type_from_content', content);
                    default:
                        return PassUIWorkerService.exec(
                            property as PassUIMethod,
                            ...(args as PassUIParams<PassUIMethod>)
                        );
                }
            };
        },
    });

const createPassUIProxy = () =>
    new Proxy<PassUIProxy>({} as any, {
        get(_, property) {
            if (property === 'toJSON') return () => ({ __type: 'PassUIProxy' });
            if (property === Symbol.toStringTag) return 'PassUIProxy';

            return async (...args: any[]) => {
                try {
                    if (!service) throw new Error('`PassCoreUI` module not initialized');
                    return (service[property as keyof PassUIProxy] as any)(...args);
                } catch (err) {
                    if (isNativeJSError(err)) {
                        logger.warn(`[PassCoreUI] Failed executing ${property.toString()}`, err);
                    }

                    throw err;
                }
            };
        },
    });

/** Safari WebKit enforces a CSP that restricts direct execution of WASM in extensions
 * pages. As a workaround, we conditionally spawn PassUI in a web worker, while using
 * the standard main-thread proxy implementation for other browsers */
const PassUI = BUILD_TARGET === 'safari' ? createPassUIWorkerProxy() : createPassUIProxy();

export default PassUI;
