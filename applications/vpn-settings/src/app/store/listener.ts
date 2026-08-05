import {
    convertAddressesListener,
    membersListener,
    organizationKeysManagementListener,
    startListeningToPlanNameChange,
    unprivatizeMembersListener,
} from '@proton/account';
import { groupKeysListener } from '@proton/account/groups/groupKeysListener';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import type { AppStartListening } from './store';

export const start = ({ startListening, mode }: { startListening: AppStartListening; mode: 'public' | 'default' }) => {
    if (mode === 'default') {
        startSharedListening(startListening);
        organizationKeysManagementListener(startListening);
        startListeningToPlanNameChange(startListening);
        convertAddressesListener(startListening);
        unprivatizeMembersListener(startListening);
        membersListener(startListening);
        groupKeysListener(startListening);
    }
};
