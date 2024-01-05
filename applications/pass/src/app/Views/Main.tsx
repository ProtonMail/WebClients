import { type FC } from 'react';
import { Route, Switch } from 'react-router-dom';

import { Hamburger } from '@proton/components';
import { useToggle } from '@proton/components/hooks';
import { InviteProvider } from '@proton/pass/components/Invite/InviteProvider';
import { ItemsProvider } from '@proton/pass/components/Item/Context/ItemsProvider';
import { ItemsList } from '@proton/pass/components/Item/List/ItemsList';
import { Content } from '@proton/pass/components/Layout/Section/Content';
import { Sidebar } from '@proton/pass/components/Layout/Section/Sidebar';
import { SubSidebar } from '@proton/pass/components/Layout/Section/SubSidebar';
import { ItemSwitch } from '@proton/pass/components/Navigation/ItemSwitch';
import { PasswordProvider } from '@proton/pass/components/Password/PasswordProvider';
import { SpotlightProvider } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { VaultActionsProvider } from '@proton/pass/components/Vault/VaultActionsProvider';
import { getLocalIDPath } from '@proton/shared/lib/authentication/pathnameHelper';

import { useClient } from '../Context/ClientProvider';
import { Header } from './Header/Header';
import { Settings } from './Settings/Settings';
import { Menu } from './Sidebar/Menu';

export const Main: FC = () => {
    const client = useClient();
    const { state: expanded, toggle } = useToggle();

    return (
        <ItemsProvider>
            <InviteProvider>
                <PasswordProvider>
                    <SpotlightProvider>
                        <div className="content-container flex flex-row flex-nowrap overflow-hidden flex-1 relative w-full h-full anime-fade-in">
                            <Sidebar expanded={expanded} onToggle={toggle}>
                                <VaultActionsProvider>
                                    <Menu onToggle={toggle} />
                                </VaultActionsProvider>
                            </Sidebar>

                            <Route path={`/${getLocalIDPath(client.state.localID)}`}>
                                {(route) => (
                                    <main id="main" className="content flex-1 overflow-hidden">
                                        <div className="flex flex-nowrap flex-column h-full">
                                            <Header hamburger={<Hamburger expanded={expanded} onToggle={toggle} />} />
                                            <div className="flex items-center justify-center flex-nowrap w-full h-full">
                                                {route.match && (
                                                    <Switch>
                                                        <Route
                                                            exact
                                                            path={`${route.match.path}/settings`}
                                                            component={Settings}
                                                        />
                                                        <Route>
                                                            {(subRoute) => (
                                                                <>
                                                                    <SubSidebar>
                                                                        <ItemsList />
                                                                    </SubSidebar>
                                                                    <Content>
                                                                        <ItemSwitch {...subRoute} />
                                                                    </Content>
                                                                </>
                                                            )}
                                                        </Route>
                                                    </Switch>
                                                )}
                                            </div>
                                        </div>
                                    </main>
                                )}
                            </Route>
                        </div>
                    </SpotlightProvider>
                </PasswordProvider>
            </InviteProvider>
        </ItemsProvider>
    );
};
