import { groupKeysListener } from '@proton/account/groups/groupKeysListener';
import { membersListener } from '@proton/account/members/membersListener';
import { unprivatizeMembersListener } from '@proton/account/members/unprivatizeMembersListener';
import { convertAddressesListener } from '@proton/account/organizationKey/convertAddressesListener';
import { organizationKeysManagementListener } from '@proton/account/organizationKey/listener';
import { resetOrganizationKeyListener } from '@proton/account/organizationKey/resetOrganizationKeyListener';
import { startListeningToPlanNameChange } from '@proton/account/subscription/startListeningToPlanNameChange';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import type { AppStartListening } from './store';

export const start = ({ startListening, mode }: { startListening: AppStartListening; mode: 'public' | 'default' }) => {
    if (mode === 'default') {
        startSharedListening(startListening);
        organizationKeysManagementListener(startListening);
        resetOrganizationKeyListener(startListening);
        startListeningToPlanNameChange(startListening);
        convertAddressesListener(startListening);
        unprivatizeMembersListener(startListening);
        membersListener(startListening);
        groupKeysListener(startListening);
    }
};
