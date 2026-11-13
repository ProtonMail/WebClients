import { eventLoopTimingTracker } from '@proton/metrics/eventLoopMetrics';
import type { SharedStartListening } from '@proton/redux-shared-store-types/interface';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';

import { addressesLoop } from '../addresses/eventLoopV6';
import type { CoreEventLoopV6Callback, CoreEventLoopV6RequiredState } from '../coreEventLoop/interface';
import { delegatedAccessLoop } from '../delegatedAccess/eventLoopV6';
import { domainsLoop } from '../domains/eventLoopV6';
import { entitlementsLoop } from '../entitlements/eventLoopV6';
import { groupMembersLoop } from '../groupMembers/eventLoopV6';
import { groupOwnerInvitesLoop } from '../groupOwnerInvites/eventLoopV6';
import { groupsLoop } from '../groups/eventLoopV6';
import { membersLoop } from '../members/eventLoopV6';
import { organizationLoop } from '../organization/eventLoopV6';
import { paymentMethodsLoop } from '../paymentMethods/eventLoopV6';
import { samlSSOLoop } from '../samlSSO/eventLoopV6';
import { subscriptionLoop } from '../subscription/eventLoopV6';
import { userLoop } from '../user/eventLoopV6';
import { userInvitationsLoops } from '../userInvitations/eventLoopV6';
import { userSettingsLoop } from '../userSettings/eventLoopV6';
import { coreEventLoopV6 } from './index';

const loops: CoreEventLoopV6Callback[] = [
    /* Order is important */
    userLoop,
    userSettingsLoop,
    addressesLoop,
    organizationLoop,
    subscriptionLoop,
    domainsLoop,
    membersLoop,
    groupMembersLoop,
    paymentMethodsLoop,
    userInvitationsLoops,
    samlSSOLoop,
    groupsLoop,
    groupOwnerInvitesLoop,
    delegatedAccessLoop,
    entitlementsLoop,
];
Object.freeze(loops);

export interface CoreEventLoopV6ListenerOptions<ExtraState> {
    /** Handlers owned by packages above account, run after the built-in ones in the given order */
    loops?: readonly CoreEventLoopV6Callback<CoreEventLoopV6RequiredState & ExtraState>[];
}

export const coreEventLoopV6Listener = <ExtraState = {}>(
    startListening: SharedStartListening<CoreEventLoopV6RequiredState & ExtraState>,
    { loops: extraLoops = [] }: CoreEventLoopV6ListenerOptions<ExtraState> = {}
) => {
    const allLoops: readonly CoreEventLoopV6Callback<CoreEventLoopV6RequiredState & ExtraState>[] = [
        ...loops,
        ...extraLoops,
    ];

    startListening({
        actionCreator: coreEventLoopV6,
        effect: async (action, { dispatch, getState, extra }) => {
            const state = getState();
            const promises = action.payload.promises;
            const event = action.payload.event;
            const api = getSilentApi(extra.api);

            eventLoopTimingTracker.startV6Processing('core');

            let apiCallsCount = 0;
            let apiFailuresCount = 0;

            allLoops.forEach((callback) => {
                const promise = callback({ event, state, dispatch, api });

                if (promise) {
                    // Wrap the promise to count failures
                    const wrappedPromise = promise.catch((error) => {
                        apiFailuresCount++;
                        throw error; // Re-throw to maintain original behavior
                    });
                    promises.push(wrappedPromise);
                    apiCallsCount++;
                }
            });

            void Promise.all(promises).finally(() => {
                eventLoopTimingTracker.endV6Processing(event.More, apiCallsCount, 'core', apiFailuresCount);
            });
        },
    });
};
