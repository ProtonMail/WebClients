import type { FC } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { PasswordUnlockProvider } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { PinUnlockProvider } from '@proton/pass/components/Lock/PinUnlockProvider';

import { useExtensionReauth } from '../../lib/hooks/useExtensionReauth';
import { usePopupContext } from './PopupProvider';
import { Lobby } from './Views/Lobby/Lobby';
import { Main } from './Views/Main';

/* The lobby view is meaningless once booted but before `POPUP_INIT` resolves:
 * a logged-in user would briefly see the signin view. Render a plain loader
 * for this transient window instead. */
const Booting: FC = () => (
    <div className="flex items-center justify-center" style={{ height: '100vh' }}>
        <CircleLoader size="medium" className="color-primary" />
    </div>
);

export const AppGuard: FC = () => {
    const { initialized } = usePopupContext();
    const { booted } = useAppState();
    const ready = booted && initialized;
    const onReauth = useExtensionReauth();

    if (ready) {
        return (
            <PasswordUnlockProvider onReauth={onReauth}>
                <PinUnlockProvider>
                    <Main />
                </PinUnlockProvider>
            </PasswordUnlockProvider>
        );
    }

    return booted ? <Booting /> : <Lobby />;
};
