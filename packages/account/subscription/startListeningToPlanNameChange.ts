import type { SharedStartListening } from '@proton/redux-shared-store-types';
import noop from '@proton/utils/noop';

import type { OrganizationState } from '../organization';
import { selectOrganization } from '../organization';

/**
 * Listen to subscription changes and update unleash feature flags after change.
 */
export const startListeningToPlanNameChange = (startListening: SharedStartListening<OrganizationState>) => {
    startListening({
        predicate: (_, currentState, previousState) => {
            const oldValue = selectOrganization(previousState);
            const newValue = selectOrganization(currentState);
            return !!(oldValue.meta.fetchedAt && oldValue.value?.PlanName !== newValue.value?.PlanName);
        },
        effect: (_, listenerApi) => {
            listenerApi.extra.unleashClient.stop();
            listenerApi.extra.unleashClient.start().catch(noop);
        },
    });
};
