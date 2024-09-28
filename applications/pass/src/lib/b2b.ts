import { store } from 'proton-pass-web/app/Store/store';
import { getB2BEventsStorageKey } from 'proton-pass-web/lib/storage';

import { authStore } from '@proton/pass/lib/auth/store';
import { createB2BEventDispatcher } from '@proton/pass/lib/b2b/b2b.dispatcher';
import { isBusinessPlan } from '@proton/pass/lib/organization/helpers';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { createDispatcherAlarm } from '@proton/pass/utils/event/alarm';

export const B2BEvents = createB2BEventDispatcher({
    alarm: createDispatcherAlarm(),
    storage: localStorage,
    getEnabled: () => isBusinessPlan(selectPassPlan(store.getState())),
    getStorageKey: () => getB2BEventsStorageKey(authStore.getLocalID()),
});
