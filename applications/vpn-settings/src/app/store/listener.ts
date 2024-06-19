import { organizationKeysManagementListener, startListeningToPlanNameChange } from '@proton/account';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import type { AppStartListening } from './store';

export const start = ({ startListening, mode }: { startListening: AppStartListening; mode: 'public' | 'default' }) => {
    if (mode === 'default') {
        startSharedListening(startListening);
        organizationKeysManagementListener(startListening);
        startListeningToPlanNameChange(startListening);
    }
};
