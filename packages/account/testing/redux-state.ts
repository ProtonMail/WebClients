import type { OrganizationExtended } from '@proton/shared/lib/interfaces';

import type { OrganizationState } from '../organization';

export const getOrganizationState = (
    value: OrganizationExtended = {} as OrganizationExtended
): OrganizationState['organization'] => {
    return {
        meta: {
            type: 1,
            fetchedAt: Date.now(),
            fetchedEphemeral: true,
        },
        value,
        error: undefined,
    };
};
