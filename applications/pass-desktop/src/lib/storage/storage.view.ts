import type { ContextBridgeApi, Maybe } from '@proton/pass/types';
import noop from '@proton/utils/noop';

/** Every `localStorage` mutation schedules a disk flush (see `storage.flush.ts`). No-op on web. */
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
