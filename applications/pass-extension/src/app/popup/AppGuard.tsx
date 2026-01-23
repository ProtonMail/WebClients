import type { FC } from 'react';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { PasswordUnlockProvider } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { PinUnlockProvider } from '@proton/pass/components/Lock/PinUnlockProvider';

import { usePopupContext } from './PopupProvider';
import { Lobby } from './Views/Lobby/Lobby';
import { Main } from './Views/Main';

export const AppGuard: FC = () => {
    const { initialized } = usePopupContext();
    const { booted } = useAppState();
    const ready = booted && initialized;

    return ready ? (
        <PasswordUnlockProvider>
            <PinUnlockProvider>
                <Main />
            </PinUnlockProvider>
        </PasswordUnlockProvider>
    ) : (
        <Lobby />
    );
};
