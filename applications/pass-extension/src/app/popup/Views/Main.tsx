import { type FC, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Route } from 'react-router-dom';

import { useExtensionClient } from 'proton-pass-extension/lib/components/Extension/ExtensionClient';
import { useSaveTabState } from 'proton-pass-extension/lib/hooks/useSaveTabState';

import useNotifications from '@proton/components/hooks/useNotifications';
import { BulkSelectProvider } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { InviteProvider } from '@proton/pass/components/Invite/InviteProvider';
import { ItemActionsProvider } from '@proton/pass/components/Item/ItemActionsProvider';
import { Items } from '@proton/pass/components/Item/Items';
import { LockOnboarding } from '@proton/pass/components/Lock/LockOnboarding';
import { InAppNotificationProvider } from '@proton/pass/components/Notifications/InAppNotificationPortal';
import { InAppNotifications } from '@proton/pass/components/Notifications/InAppNotifications';
import { OnboardingSSO } from '@proton/pass/components/Onboarding/OnboardingSSO';
import { OrganizationProvider } from '@proton/pass/components/Organization/OrganizationProvider';
import { PasswordProvider } from '@proton/pass/components/Password/PasswordProvider';
import { SpotlightProvider } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { WithSpotlight } from '@proton/pass/components/Spotlight/WithSpotlight';
import { UpsellingProvider } from '@proton/pass/components/Upsell/UpsellingProvider';
import { VaultActionsProvider } from '@proton/pass/components/Vault/VaultActionsProvider';
import { selectIsSSO, selectLockSetupRequired } from '@proton/pass/store/selectors';
import { SpotlightMessage } from '@proton/pass/types';

import { Header } from './Header/Header';

import './Main.scss';

const MainSwitch: FC = () => {
    const isSSO = useSelector(selectIsSSO);

    return (
        <Route path="*">
            {({ match }) => (
                <main
                    key="main"
                    id="main"
                    className="flex flex-column flex-nowrap w-full h-full overflow-hidden anime-fade-in"
                    style={{ '--anime-delay': '50ms' }}
                >
                    <Header />
                    <div id="pass-layout" className="flex items-center justify-center flex-nowrap w-full h-full">
                        {match && <Route component={Items} />}
                        <InAppNotifications />
                        {isSSO && (
                            <WithSpotlight type={SpotlightMessage.SSO_CHANGE_LOCK}>
                                {(props) => <OnboardingSSO {...props} />}
                            </WithSpotlight>
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

    useSaveTabState();

    /** Clear notifications when `Main` unmounts */
    const { clearNotifications } = useNotifications();
    useEffect(() => () => clearNotifications(), []);

    return (
        <OrganizationProvider>
            <BulkSelectProvider>
                <VaultActionsProvider>
                    <ItemActionsProvider>
                        <InviteProvider>
                            <PasswordProvider>
                                <UpsellingProvider>
                                    <SpotlightProvider>
                                        <InAppNotificationProvider>
                                            {lockSetup ? (
                                                <LockOnboarding onCancel={() => logout({ soft: true })} />
                                            ) : (
                                                <MainSwitch />
                                            )}
                                        </InAppNotificationProvider>
                                    </SpotlightProvider>
                                </UpsellingProvider>
                            </PasswordProvider>
                        </InviteProvider>
                    </ItemActionsProvider>
                </VaultActionsProvider>
            </BulkSelectProvider>
        </OrganizationProvider>
    );
};
