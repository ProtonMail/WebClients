import { SW_ACTIVATION_MAX_RETRIES } from 'proton-pass-web/app/ServiceWorker/constants';

import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { PUBLIC_PATH } from '@proton/shared/lib/webpack.constants';

export const registerServiceWorker = (retryCount: number = 0): Promise<void> =>
    new Promise<void>((resolve, reject) => {
        if (retryCount > SW_ACTIVATION_MAX_RETRIES) reject('Max activation retries reached');

        const retry = () =>
            registerServiceWorker(retryCount + 1)
                .then(resolve)
                .catch(reject);

        return navigator.serviceWorker
            .register(
                /* webpackChunkName: "pass.service-worker" */
                new URL('proton-pass-web/app/ServiceWorker/worker/service', import.meta.url),
                { scope: `/${stripLeadingAndTrailingSlash(PUBLIC_PATH)}` }
            )
            .then(async (reg) => {
                const incoming = reg.installing || reg.waiting;

                /** If the service worker is active and there's no incoming
                 * worker, resolve the activation immediately */
                if (!incoming) return reg.active ? resolve() : retry();
                else {
                    /* If the service worker is not yet activated, wait
                     * for it to change to an `activated` state */
                    incoming.onstatechange = (event) => {
                        const next = event.target as ServiceWorker;

                        switch (next.state) {
                            case 'activated':
                                incoming.onstatechange = null;
                                return resolve();

                            case 'redundant':
                                incoming.onstatechange = null;
                                return retry();
                        }
                    };
                }
            });
    });
