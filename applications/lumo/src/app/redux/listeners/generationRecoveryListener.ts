import { signoutAction } from '@proton/account/authenticationService/authenticationListener';

import { clearGenerationRecoveryOnLogout } from '../../services/generation/recovery';
import type { AppStartListening } from '../store';

export function startGenerationRecoveryListener(startListening: AppStartListening) {
    startListening({
        actionCreator: signoutAction,
        effect: () => clearGenerationRecoveryOnLogout(),
    });
}
