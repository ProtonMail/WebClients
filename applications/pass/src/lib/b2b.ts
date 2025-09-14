import { store } from 'proton-pass-web/app/Store/store';
import { getB2BEventsStorageKey } from 'proton-pass-web/lib/storage';

import { authStore } from '@proton/pass/lib/auth/store';
import type { B2BEventDispatcher } from '@proton/pass/lib/b2b/b2b.dispatcher';
import { createB2BEventDispatcher } from '@proton/pass/lib/b2b/b2b.dispatcher';
import { isBusinessPlan } from '@proton/pass/lib/organization/helpers';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { createTimeoutAlarm } from '@proton/pass/utils/time/alarm';

export const B2BEvents = (() => {
    const service: B2BEventDispatcher = createB2BEventDispatcher({
        alarm: createTimeoutAlarm('b2b', () => service.send()),
        storage: localStorage,
        getEnabled: () => isBusinessPlan(selectPassPlan(store.getState())),
        getStorageKey: () => getB2BEventsStorageKey(authStore.getLocalID()),
    });

    return service;
})();
