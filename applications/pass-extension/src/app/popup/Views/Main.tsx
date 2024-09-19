import { type FC, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Route, Switch } from 'react-router-dom';

import { useExtensionClient } from 'proton-pass-extension/lib/components/Extension/ExtensionClient';
import { usePopupStateEffects } from 'proton-pass-extension/lib/hooks/usePopupStateEffects';

import { useNotifications } from '@proton/components/hooks';
import { BulkSelectProvider } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { InviteProvider } from '@proton/pass/components/Invite/InviteProvider';
import { ItemsProvider } from '@proton/pass/components/Item/Context/ItemsProvider';
import { ItemActionsProvider } from '@proton/pass/components/Item/ItemActionsProvider';
import { Items } from '@proton/pass/components/Item/Items';
import { LockOnboarding } from '@proton/pass/components/Lock/LockOnboarding';
import { OrganizationProvider } from '@proton/pass/components/Organization/OrganizationProvider';
import { PasswordProvider } from '@proton/pass/components/Password/PasswordProvider';
import { SecureLinks } from '@proton/pass/components/SecureLink/SecureLinks';
import { SpotlightProvider } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { selectLockSetupRequired } from '@proton/pass/store/selectors';

import { Header } from './Header/Header';

import './Main.scss';

const MainSwitch: FC = () => {
    const sub = (basePath: string, path: string) => `${basePath}/${path}`;

    return (
        <Route>
            {({ match }) => (
                <main
                    key="main"
                    id="main"
                    className="flex flex-column flex-nowrap w-full h-full overflow-hidden anime-fade-in"
                    style={{ '--anime-delay': '50ms' }}
                >
                    <Header />
                    <div id="pass-layout" className="flex items-center justify-center flex-nowrap w-full h-full">
                        {match && (
                            <Switch>
                                <Route path={sub(match.path, 'secure-links')} component={SecureLinks} />
                                <Route component={Items} />
                            </Switch>
                        )}
                    </div>
                </main>
            )}
        </Route>
    );
};

export const Main: FC = () => {
    const { logout } = useExtensionClient();
    const lockSetup = useSelector(selectLockSetupRequired);

    usePopupStateEffects();

    /** Clear notifications when `Main` unmounts */
    const { clearNotifications } = useNotifications();
    useEffect(() => () => clearNotifications(), []);

    return (
        <OrganizationProvider>
            <ItemsProvider>
                <BulkSelectProvider>
                    <ItemActionsProvider>
                        <InviteProvider>
                            <PasswordProvider>
                                <SpotlightProvider>
                                    {lockSetup ? (
                                        <LockOnboarding onCancel={() => logout({ soft: true })} />
                                    ) : (
                                        <MainSwitch />
                                    )}
                                </SpotlightProvider>
                            </PasswordProvider>
                        </InviteProvider>
                    </ItemActionsProvider>
                </BulkSelectProvider>
            </ItemsProvider>
        </OrganizationProvider>
    );
};
