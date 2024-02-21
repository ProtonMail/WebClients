import { type FC, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Route, Switch } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Hamburger } from '@proton/components';
import { useNotifications, useToggle } from '@proton/components/hooks';
import { BulkSelectProvider } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { InviteProvider } from '@proton/pass/components/Invite/InviteProvider';
import { ItemsProvider } from '@proton/pass/components/Item/Context/ItemsProvider';
import { ItemActionsProvider } from '@proton/pass/components/Item/ItemActionsProvider';
import { ItemsList } from '@proton/pass/components/Item/List/ItemsList';
import { Content } from '@proton/pass/components/Layout/Section/Content';
import { Sidebar } from '@proton/pass/components/Layout/Section/Sidebar';
import { SubSidebar } from '@proton/pass/components/Layout/Section/SubSidebar';
import { ItemSwitch } from '@proton/pass/components/Navigation/ItemSwitch';
import { OnboardingProvider } from '@proton/pass/components/Onboarding/OnboardingProvider';
import { PasswordProvider } from '@proton/pass/components/Password/PasswordProvider';
import { SpotlightProvider } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { UpsellingModal } from '@proton/pass/components/Upsell/UpsellingModal';
import { VaultActionsProvider } from '@proton/pass/components/Vault/VaultActionsProvider';
import { UpsellRef } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { getLocalIDPath } from '@proton/shared/lib/authentication/pathnameHelper';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

import { useAuthService } from '../Context/AuthServiceProvider';
import { useClient } from '../Context/ClientProvider';
import { Header } from './Header/Header';
import { TopBar } from './Header/TopBar';
import { Onboarding } from './Onboarding/Onboarding';
import { Settings } from './Settings/Settings';
import { Menu } from './Sidebar/Menu';

const MainSwitch: FC = () => {
    const client = useClient();
    const { state: expanded, toggle } = useToggle();

    return (
        <div className="content-container flex flex-1 shrink-0 flex-column">
            <TopBar />
            <div className="flex flex-row flex-nowrap overflow-hidden flex-1 relative w-full h-full anime-fade-in">
                <Sidebar expanded={expanded} onToggle={toggle}>
                    <Menu onToggle={toggle} />
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
                                                path={`${route.match.path}/onboarding`}
                                                component={Onboarding}
                                            />
                                            <Route exact path={`${route.match.path}/settings`} component={Settings} />
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
        </div>
    );
};

export const Main: FC = () => {
    const freeAccessEnabled = useFeatureFlag(PassFeature.PassEnableDesktopFreePlan);
    const [upgradeState, setUpgradeState] = useState<{ upgrade: boolean }>({ upgrade: false });
    const forceUpgrade = [UserPassPlan.FREE, UserPassPlan.TRIAL].includes(useSelector(selectPassPlan));
    const authService = useAuthService();
    const { createNotification, clearNotifications } = useNotifications();
    const enhance = useNotificationEnhancer();
    const onLogout = useCallback(async () => {
        createNotification(enhance({ text: c('Info').t`Logging you out...`, type: 'info', loading: true }));
        await authService.logout({ soft: false });
        clearNotifications();
    }, []);

    useEffect(() => {
        if (!isElectronApp || freeAccessEnabled) return;
        setUpgradeState({ upgrade: forceUpgrade });
    }, []);

    return (
        <>
            <ItemsProvider>
                <BulkSelectProvider>
                    <ItemActionsProvider>
                        <InviteProvider>
                            <VaultActionsProvider>
                                <PasswordProvider>
                                    <SpotlightProvider>
                                        <OnboardingProvider>
                                            <MainSwitch />
                                        </OnboardingProvider>
                                    </SpotlightProvider>
                                </PasswordProvider>
                            </VaultActionsProvider>
                        </InviteProvider>
                    </ItemActionsProvider>
                </BulkSelectProvider>
            </ItemsProvider>

            {upgradeState.upgrade && (
                <UpsellingModal
                    upsellType="early-access"
                    open={upgradeState.upgrade}
                    closable={false}
                    upsellRef={UpsellRef.EARLY_ACCESS}
                    extraActions={() => [
                        <Button pill shape="solid" color="weak" onClick={onLogout} key="sign-out">{c('Action')
                            .t`Sign out`}</Button>,
                    ]}
                />
            )}
        </>
    );
};
