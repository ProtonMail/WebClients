import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';

import { signoutAction } from '@proton/account/authenticationService/authenticationListener';

import { clearGenerationRecoveryOnLogout } from '../../services/generation/recovery';
import type { AppStartListening } from '../store';
import { startGenerationRecoveryListener } from './generationRecoveryListener';

jest.mock('../../services/generation/recovery');

it('clears recovery when account signout is requested', async () => {
    const listener = createListenerMiddleware();
    startGenerationRecoveryListener(listener.startListening as AppStartListening);
    const store = configureStore({
        reducer: () => ({}),
        middleware: (defaults) => defaults().prepend(listener.middleware),
    });
    store.dispatch(signoutAction({ clearDeviceRecovery: false }));
    await waitFor(() => expect(clearGenerationRecoveryOnLogout).toHaveBeenCalledTimes(1));
});
