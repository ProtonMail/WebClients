import { CacheType } from '@proton/redux-utilities';

import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { organizationThunk, selectOrganization } from './index';

export const organizationLoop: CoreEventLoopV6Callback = ({ event, state, dispatch }) => {
    if ((event.Organizations || event.OrganizationSettings) && selectOrganization(state)?.value) {
        const type =
            // If both organization and organization settings got updated, fetch both
            event.Organizations && event.OrganizationSettings
                ? 'extended'
                : // If only the organization got updated, fetch only organization
                  event.Organizations
                  ? 'organization'
                  : // Otherwise, fetch only settings
                    'settings';

        return dispatch(organizationThunk({ cache: CacheType.None, type }));
    }
};
