import { c } from 'ttag';

import type { Organization } from '@proton/shared/lib/interfaces';

export const getPrivateLabel = () => {
    return c('unprivatization').t`Private user`;
};

export const disableStorageSelection = (organization: Organization | undefined): boolean => {
    // When the organization has only one member, do not allow the user to reduce their storage allocation
    // As subscription events will reset storage allocation any change user makes here will be rest. Hence, allowing the user to change will only cause more trouble
    // However, If they had fewer storage allocated, let them expand to max space.
    const { MaxMembers, AssignedSpace, MaxSpace } = organization || {};
    return MaxMembers === 1 && AssignedSpace === MaxSpace;
};
