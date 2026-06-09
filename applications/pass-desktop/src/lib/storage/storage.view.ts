import type { ContextBridgeApi, Maybe } from '@proton/pass/types';
import noop from '@proton/utils/noop';

/** Chromium flushes DOMStorage (where the persisted session blob, settings and
 * other reboot-sensitive data live) to disk asynchronously, so an abrupt
 * termination (OS reboot) can drop the latest write. Wrap the storage write
 * methods once so every `localStorage` mutation schedules a debounced disk
 * flush via the bridge — no per-call-site flushing required. No-op on web. */
export const installStorageFlush = (bridge: Maybe<ContextBridgeApi>) => {
    if (!bridge) return;

    let scheduled = false;
    const scheduleFlush = () => {
        if (scheduled) return;
        scheduled = true;
        setTimeout(() => {
            scheduled = false;
            bridge.flushStorageData().catch(noop);
        }, 0);
    };

    const { setItem, removeItem, clear } = Storage.prototype;

    Storage.prototype.setItem = function (key, value) {
        setItem.call(this, key, value);
        if (this === window.localStorage) scheduleFlush();
    };

    Storage.prototype.removeItem = function (key) {
        removeItem.call(this, key);
        if (this === window.localStorage) scheduleFlush();
    };

    Storage.prototype.clear = function () {
        clear.call(this);
        if (this === window.localStorage) scheduleFlush();
    };
};
