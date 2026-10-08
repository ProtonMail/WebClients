import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';

import { serverEvent } from '../eventLoop';
import { type EntitlementsState, selectEntitlements } from './index';
import { refetchEntitlementsAndCatalog } from './refetchEntitlementsAndCatalog';

export const entitlementsListener = <T extends EntitlementsState>(startListening: SharedStartListening<T>) => {
    startListening({
        actionCreator: serverEvent,
        effect: async (action, { dispatch, extra, getState }) => {
            if (
                (action.payload.OrganizationEntitlements || action.payload.MemberEntitlements) &&
                selectEntitlements(getState())?.value
            ) {
                await refetchEntitlementsAndCatalog({
                    dispatch,
                    api: getSilentApi(extra.api),
                });
            }
        },
    });
};
