import { type FC, useCallback } from 'react';
import { Route, Switch } from 'react-router-dom';

import { Hamburger } from '@proton/components';
import { useToggle } from '@proton/components/hooks';
import { useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import { InviteProvider } from '@proton/pass/components/Invite/InviteProvider';
import { Sidebar } from '@proton/pass/components/Layout/Section/Sidebar';
import { PasswordProvider } from '@proton/pass/components/Password/PasswordProvider';
import { SpotlightProvider } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { VaultActionsProvider } from '@proton/pass/components/Vault/VaultActionsProvider';
import { getLocalIDPath } from '@proton/shared/lib/authentication/pathnameHelper';
import noop from '@proton/utils/noop';

import { useClient } from '../Context/ClientProvider';
import { Header } from './Header/Header';
import { ItemSwitch } from './Item/ItemSwitch';
import { Settings } from './Settings/Settings';
import { Menu } from './Sidebar/Menu';

export const Main: FC = () => {
    const client = useClient();
    const { setFilters } = useNavigation();
    const { state: expanded, toggle } = useToggle();

    return (
        <InviteProvider onVaultCreated={useCallback((shareId) => setFilters({ selectedShareId: shareId }), [])}>
            <PasswordProvider>
                <SpotlightProvider>
                    <div className="content-container flex flex-row flex-nowrap no-scroll flex-item-fluid relative w-full h-full anime-fade-in">
                        <Sidebar expanded={expanded} onToggle={toggle}>
                            <VaultActionsProvider onVaultCreated={noop} onVaultDeleted={noop}>
                                <Menu onToggle={toggle} />
                            </VaultActionsProvider>
                        </Sidebar>

                        <Route path={`/${getLocalIDPath(client.state.localID)}`}>
                            {(route) => (
                                <main id="main" className="content flex-item-fluid overflow-hidden">
                                    <div className="flex flex-nowrap flex-column h-full">
                                        <Header hamburger={<Hamburger expanded={expanded} onToggle={toggle} />} />
                                        <div className="flex flex-align-items-center justify-center flex-nowrap w-full h-full">
                                            <Switch>
                                                <Route
                                                    exact
                                                    path={`${route.match!.path}/settings`}
                                                    component={Settings}
                                                />
                                                <Route component={ItemSwitch} />
                                            </Switch>
                                        </div>
                                    </div>
                                </main>
                            )}
                        </Route>
                    </div>
                </SpotlightProvider>
            </PasswordProvider>
        </InviteProvider>
    );
};
