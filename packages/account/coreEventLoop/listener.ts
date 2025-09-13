import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';

import { addressesLoop } from '../addresses/eventLoopV6';
import type { CoreEventLoopV6Callback, CoreEventLoopV6RequiredState } from '../coreEventLoop/interface';
import { delegatedAccessLoop } from '../delegatedAccess/eventLoopV6';
import { domainsLoop } from '../domains/eventLoopV6';
import { groupMembersLoop } from '../groupMembers/eventLoopV6';
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
    delegatedAccessLoop,
];
Object.freeze(loops);

export const coreEventLoopV6Listener = (startListening: SharedStartListening<CoreEventLoopV6RequiredState>) => {
    startListening({
        actionCreator: coreEventLoopV6,
        effect: async (action, { dispatch, getState, extra }) => {
            const state = getState();
            const promises = action.payload.promises;
            const event = action.payload.event;
            const api = getSilentApi(extra.api);

            loops.forEach((callback) => {
                const promise = callback({ event, state, dispatch, api });
                if (promise) {
                    promises.push(promise);
                }
            });
        },
    });
};
