import { useLayoutEffect } from 'react';

import { traceError } from '@proton/shared/lib/helpers/sentry';

import { getRecoveryKit } from './getRecoveryKit';

let ranPreload = false;

/**
 * Prefetch @proton/recovery-kit
 * To be called before useRecoveryKitDownload to speed up recovery kit generation
 */
export const usePrefetchGenerateRecoveryKit = () => {
    useLayoutEffect(() => {
        if (ranPreload) {
            return;
        }

        ranPreload = true;

        setTimeout(() => {
            /* Custom preload */
            getRecoveryKit()
                .then((result) => {
                    document.body.append(...result.getPrefetch());
                })
                .catch((e) => {
                    traceError(e);
                });
        }, 0);
    }, []);
};
