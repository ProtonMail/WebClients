import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { selectEntitlements } from './index';
import { refetchEntitlementsAndCatalog } from './refetchEntitlementsAndCatalog';

export const entitlementsLoop: CoreEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    if ((event.OrganizationEntitlements || event.MemberEntitlements) && selectEntitlements(state)?.value) {
        return refetchEntitlementsAndCatalog({ dispatch, api });
    }
};
