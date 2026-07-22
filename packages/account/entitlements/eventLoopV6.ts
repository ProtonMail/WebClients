import { CacheType } from '@proton/redux-utilities/interface';

import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { entitlementsThunk, selectEntitlements } from './index';

export const entitlementsLoop: CoreEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    if ((event.OrganizationEntitlements || event.MemberEntitlements) && selectEntitlements(state)?.value) {
        return dispatch(entitlementsThunk({ api, cache: CacheType.None }));
    }
};
