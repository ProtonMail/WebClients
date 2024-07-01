import type { SharedStartListening } from '@proton/redux-shared-store-types';

import { OrganizationState, selectOrganization } from '../organization';

/**
 * Listen to subscription changes and update unleash feature flags after change.
 */
export const startListeningToPlanNameChange = (startListening: SharedStartListening<OrganizationState>) => {
    startListening({
        predicate: (_, currentState, nextState) => {
            const oldValue = selectOrganization(currentState);
            const newValue = selectOrganization(nextState);
            return !!(oldValue.meta.fetchedAt && oldValue.value?.PlanName !== newValue.value?.PlanName);
        },
        effect: (_, listenerApi) => {
            listenerApi.extra.unleashClient.stop();
            void listenerApi.extra.unleashClient.start();
        },
    });
};
