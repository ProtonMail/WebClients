import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';

import { serverEvent } from '../eventLoop';
import { type EntitlementsState, entitlementsThunk, selectEntitlements } from './index';

export const entitlementsListener = <T extends EntitlementsState>(startListening: SharedStartListening<T>) => {
    startListening({
        actionCreator: serverEvent,
        effect: async (action, { dispatch, extra, getState }) => {
            if (
                (action.payload.OrganizationEntitlements || action.payload.MemberEntitlements) &&
                selectEntitlements(getState())?.value
            ) {
                await dispatch(entitlementsThunk({ api: getSilentApi(extra.api), cache: CacheType.None }));
            }
        },
    });
};
