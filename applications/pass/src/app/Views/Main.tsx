import { type FC } from 'react';

import { Button } from '@proton/atoms/Button';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';

import { useAuthService } from '../Context/AuthServiceProvider';

export const Main: FC = () => {
    const authService = useAuthService();

    return (
        <LobbyLayout overlay>
            <main className="h-full w-full flex flex-column gap-4 flex-align-items-center flex-justify-center">
                <h4>Logged in to Pass</h4>
                <Button pill shape="solid" color="weak" onClick={() => authService.logout({ soft: false })}>
                    Logout
                </Button>
            </main>
        </LobbyLayout>
    );
};
