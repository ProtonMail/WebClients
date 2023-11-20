import { type FC, useCallback } from 'react';

import { Button } from '@proton/atoms/Button';
import { Hamburger } from '@proton/components';
import { useToggle } from '@proton/components/hooks';
import { useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import { InviteContextProvider } from '@proton/pass/components/Invite/InviteContextProvider';
import { Content } from '@proton/pass/components/Layout/Section/Content';
import { Sidebar } from '@proton/pass/components/Layout/Section/Sidebar';
import { PasswordContextProvider } from '@proton/pass/components/PasswordGenerator/PasswordContext';
import { VaultActionsProvider } from '@proton/pass/components/Vault/VaultActionsProvider';
import noop from '@proton/utils/noop';

import { useAuthService } from '../Context/AuthServiceProvider';
import { Header } from './Header/Header';
import { ItemSwitch } from './Item/ItemSwitch';
import { Items } from './Sidebar/Items';
import { SidebarLayout } from './Sidebar/SidebarLayout';
import { SidebarMenu } from './Sidebar/SidebarMenu';

export const Main: FC = () => {
    const { setFilters } = useNavigation();
    const authService = useAuthService();
    const { state: expanded, toggle } = useToggle();

    return (
        <InviteContextProvider onVaultCreated={useCallback((shareId) => setFilters({ selectedShareId: shareId }), [])}>
            <PasswordContextProvider initial={null}>
                <div className="content-container flex flex-row flex-nowrap no-scroll flex-item-fluid relative w-full h-full">
                    <SidebarLayout expanded={expanded} onToggleExpand={toggle}>
                        <VaultActionsProvider onVaultCreated={noop} onVaultDeleted={noop}>
                            <SidebarMenu />
                        </VaultActionsProvider>
                    </SidebarLayout>

                    <main id="main" className="content flex-item-fluid overflow-hidden">
                        <div className="flex flex-nowrap flex-column h-full">
                            <Header hamburger={<Hamburger expanded={expanded} onToggle={toggle} />} />
                            <div className="flex flex-align-items-center flex-justify-center flex-nowrap w-full h-full">
                                <Sidebar>
                                    <Items />
                                    <Button
                                        shape="ghost"
                                        color="weak"
                                        onClick={() => authService.logout({ soft: false })}
                                    >
                                        Logout
                                    </Button>
                                </Sidebar>
                                <Content>
                                    <ItemSwitch />
                                </Content>
                            </div>
                        </div>
                    </main>
                </div>
            </PasswordContextProvider>
        </InviteContextProvider>
    );
};
