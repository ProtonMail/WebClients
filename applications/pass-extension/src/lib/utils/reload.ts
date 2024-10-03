import { RUNTIME_RELOAD_THROTTLE, RUNTIME_RELOAD_TIMEOUT } from '@proton/pass/constants';
import browser from '@proton/pass/lib/globals/browser';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { wait } from '@proton/shared/lib/helpers/promise';

/** Allows triggering custom callback function when the
 * `ProtonPassExtensionReloader` webpack plugin sends a
 * "reload" message.  */
export const devReload = (cb: () => void, description: string) => {
    if (RUNTIME_RELOAD) {
        const socket = new WebSocket(`ws://localhost:${RUNTIME_RELOAD_PORT}`);

        socket.addEventListener('message', ({ data }: MessageEvent) => {
            const message = JSON.parse(data);

            if (message.reload) {
                console.info(`[ProtonPassExtensionReloader] - ${description}`);
                cb();
            }
        });

        socket.addEventListener('error', () =>
            console.info('[ProtonPassExtensionReloader] - Error while communicating with WS server')
        );
    }
};

export const reloadManager = (() => {
    let runtimeReloading = false;

    /** Reloads the current app IIF there isn't a pending runtime reload */
    const appReload = () => setTimeout(() => !runtimeReloading && window.location.reload(), RUNTIME_RELOAD_TIMEOUT);

    const runtimeReload = asyncLock(async (options?: { immediate: boolean }) => {
        runtimeReloading = true;

        if (!options?.immediate) {
            const now = getEpoch();
            const { lastReload = 0 } = await browser.storage.local.get('lastReload');
            if (lastReload + RUNTIME_RELOAD_THROTTLE > now) throw new Error();

            await wait(RUNTIME_RELOAD_TIMEOUT);
            await browser.storage.local.set({ lastReload: now });
        }

        /** Safari may not close the popup on runtime
         * reload in safari 18+ : force close the window */
        browser.runtime.reload();
        window.close();
    });

    return { appReload, runtimeReload };
})();
