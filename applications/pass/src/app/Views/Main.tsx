import { type FC, useCallback } from 'react';

import { Button } from '@proton/atoms/Button';
import { useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import { InviteContextProvider } from '@proton/pass/components/Invite/InviteContextProvider';
import { FadeIn } from '@proton/pass/components/Layout/Animation/FadeIn';
import { Content } from '@proton/pass/components/Layout/Section/Content';
import { Sidebar } from '@proton/pass/components/Layout/Section/Sidebar';
import { PasswordContextProvider } from '@proton/pass/components/PasswordGenerator/PasswordContext';

import { useAuthService } from '../Context/AuthServiceProvider';
import { Header } from './Header/Header';
import { ItemSwitch } from './Item/ItemSwitch';
import { Items } from './Sidebar/Items';

export const Main: FC = () => {
    const { setFilters } = useNavigation();
    const authService = useAuthService();

    return (
        <InviteContextProvider onVaultCreated={useCallback((shareId) => setFilters({ selectedShareId: shareId }), [])}>
            <PasswordContextProvider initial={null}>
                <FadeIn
                    id="main"
                    className="flex flex-column flex-nowrap w-full h-full overflow-hidden"
                    key="main"
                    delay={50}
                >
                    <Header />
                    <main className="flex flex-align-items-center flex-justify-center flex-nowrap w-full h-full">
                        <Sidebar>
                            <Items />
                            <Button shape="ghost" color="weak" onClick={() => authService.logout({ soft: false })}>
                                Logout
                            </Button>
                        </Sidebar>
                        <Content>
                            <ItemSwitch />
                        </Content>
                    </main>
                </FadeIn>
            </PasswordContextProvider>
        </InviteContextProvider>
    );
};
