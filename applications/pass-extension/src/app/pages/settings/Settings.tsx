import type { FC } from 'react';
import { type ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Provider as ReduxProvider, useSelector } from 'react-redux';
import { HashRouter, Route, Switch, useHistory } from 'react-router-dom';

import { APP_VERSION } from 'proton-pass-extension/app/config';
import { ExtensionApp } from 'proton-pass-extension/lib/components/Extension/ExtensionApp';
import { ExtensionConnect, useExtensionConnect } from 'proton-pass-extension/lib/components/Extension/ExtensionConnect';
import { ExtensionHead } from 'proton-pass-extension/lib/components/Extension/ExtensionHead';
import { ExtensionContext } from 'proton-pass-extension/lib/context/extension-context';
import { createClientStore } from 'proton-pass-extension/lib/store/client-store';
import { c, msgid } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar';
import { Icon, Tabs, useNotifications } from '@proton/components';
import { Localized } from '@proton/pass/components/Core/Localized';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { PasswordUnlockProvider } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { PinUnlockProvider } from '@proton/pass/components/Lock/PinUnlockProvider';
import { OrganizationProvider, useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { ApplicationLogs } from '@proton/pass/components/Settings/ApplicationLogs';
import { Import } from '@proton/pass/components/Settings/Import';
import { AccountPath, UpsellRef } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { clientSessionLocked } from '@proton/pass/lib/client';
import { pageMessage } from '@proton/pass/lib/extension/message';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import {
    selectPassPlan,
    selectPlanDisplayName,
    selectTrialDaysRemaining,
    selectUser,
} from '@proton/pass/store/selectors';
import { type Unpack, WorkerMessageType, type WorkerMessageWithSender } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { Aliases } from './Views/Aliases';
import { Developer } from './Views/Developer';
import { Export } from './Views/Export';
import { General } from './Views/General';
import { Security } from './Views/Security';
import { Support } from './Views/Support';

import './Settings.scss';

type Tab = Unpack<Exclude<ComponentProps<typeof Tabs>['tabs'], undefined>>;
type SettingTab = Tab & { path: string; hidden?: boolean };

const getSettingsTabs = (orgEnabled: boolean = false, aliasesEnabled: boolean): SettingTab[] => [
    { path: '/', title: c('Label').t`General`, content: <General /> },
    ...(aliasesEnabled ? [{ path: '/aliases', title: c('Label').t`Aliases`, content: <Aliases /> }] : []),
    { path: '/security', title: c('Label').t`Security`, content: <Security /> },
    { path: '/import', title: c('Label').t`Import`, content: <Import /> },
    { path: '/export', title: c('Label').t`Export`, content: <Export /> },
    { path: '/account', title: c('Label').t`Account`, icon: 'arrow-out-square', content: <></> },
    ...(orgEnabled
        ? [
              {
                  path: '/organization',
                  title: c('Label').t`Organization`,
                  icon: 'arrow-out-square',
                  content: <></>,
              } as const,
          ]
        : []),
    { path: '/support', title: c('Label').t`Support`, content: <Support /> },
    ...(ENV === 'development' ? [{ path: '/dev', title: 'Developer', content: <Developer /> }] : []),
];

const pathnameToIndex = (pathname: string, availableTabs: SettingTab[]) => {
    const idx = availableTabs.findIndex((tab) => tab.path === pathname);
    return idx !== -1 ? idx : 0;
};

const SettingsTabs: FC<{ pathname: string }> = ({ pathname }) => {
    const context = useExtensionConnect();
    const user = useSelector(selectUser);
    const organization = useOrganization();
    const aliasesEnabled = useFeatureFlag(PassFeature.PassSimpleLoginAliasesSync);

    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);
    const trialDaysLeft = useSelector(selectTrialDaysRemaining);

    const tabs = useMemo(() => getSettingsTabs(organization?.settings.enabled, aliasesEnabled), [organization]);
    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD);
    const navigateToOrganization = useNavigateToAccount(AccountPath.POLICIES);

    const history = useHistory();
    const [activeTab, setActiveTab] = useState<number>(pathnameToIndex(pathname, tabs));

    const handleOnChange = (nextTab: number) => {
        if (tabs[nextTab].path === '/account') navigateToAccount();
        else if (tabs[nextTab].path === '/organization') navigateToOrganization();
        else history.push(tabs[nextTab].path);
    };

    useEffect(() => setActiveTab(pathnameToIndex(pathname, tabs)), [pathname, tabs]);

    if (context.state.authorized) {
        return (
            <PasswordUnlockProvider>
                <PinUnlockProvider>
                    <div className="mb-8">
                        <div className="flex w-full justify-space-between items-start">
                            <div className="flex items-start">
                                <Avatar className="mr-2 mt-1">{user?.DisplayName?.toUpperCase()?.[0]}</Avatar>
                                <span>
                                    <span className="block text-semibold text-ellipsis">{user?.DisplayName}</span>
                                    <span className="block text-sm text-ellipsis">{user?.Email}</span>
                                    <span className="block color-weak text-sm text-italic">{planDisplayName}</span>
                                </span>
                            </div>
                            <div className="flex items-end flex-column">
                                {!isPaidPlan(passPlan) && (
                                    <>
                                        <span className="block mb-1">
                                            {planDisplayName}
                                            <span className="color-weak text-italic text-sm">
                                                {' '}
                                                {trialDaysLeft &&
                                                    `(${c('Info').ngettext(
                                                        msgid`${trialDaysLeft} day left`,
                                                        `${trialDaysLeft} days left`,
                                                        trialDaysLeft
                                                    )})`}
                                            </span>
                                        </span>
                                        <UpgradeButton inline upsellRef={UpsellRef.SETTING} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <Tabs
                        className="w-full"
                        contentClassName="p-0"
                        navContainerClassName="mb-6"
                        onChange={handleOnChange}
                        tabs={tabs}
                        value={activeTab}
                    />

                    <div className="mt-auto">
                        <hr />
                        <span className="block text-sm color-weak text-center">
                            {PASS_APP_NAME} v{APP_VERSION}
                        </span>
                    </div>
                </PinUnlockProvider>
            </PasswordUnlockProvider>
        );
    }

    return (
        <div className="flex flex-column items-center justify-center my-auto">
            <Icon name="lock-filled" size={10} className="mb-4" />
            {clientSessionLocked(context.state.status) && (
                <>
                    <span className="block color-norm">{c('Info').t`Your ${PASS_APP_NAME} session is locked`}</span>
                    <span className="block text-sm color-weak">{c('Info')
                        .t`Unlock it with your PIN to access the settings`}</span>
                </>
            )}
        </div>
    );
};

const SettingsApp: FC = () => {
    const { createNotification } = useNotifications();
    const enhance = useNotificationEnhancer();

    const handleWorkerMessage = useCallback((message: WorkerMessageWithSender) => {
        if (message.type === WorkerMessageType.NOTIFICATION && message.payload.notification.endpoint === 'page') {
            createNotification(enhance(message.payload.notification));
        }
    }, []);

    return (
        <Localized>
            <HashRouter>
                <ExtensionConnect endpoint="page" messageFactory={pageMessage} onWorkerMessage={handleWorkerMessage}>
                    <ExtensionHead title={c('Title').t`${PASS_APP_NAME} Settings`} />
                    <div
                        className="pass-settings flex flex-column ui-standard w-full p-4 mx-auto bg-weak min-h-custom"
                        style={{ '--min-h-custom': '100vh' }}
                    >
                        <Switch>
                            <Route
                                exact
                                path={'/logs'}
                                render={() => (
                                    <div className="max-h-full max-w-full">
                                        <ApplicationLogs
                                            opened
                                            style={{ '--h-custom': 'max(calc(100vh - 130px), 18.75rem)' }}
                                        />
                                    </div>
                                )}
                            />
                            <Route render={({ location: { pathname } }) => <SettingsTabs pathname={pathname} />} />
                        </Switch>
                    </div>
                </ExtensionConnect>
            </HashRouter>
        </Localized>
    );
};

export const Settings: FC = () => {
    const store = useRef<ReturnType<typeof createClientStore>>();

    return (
        <>
            <ExtensionApp endpoint="page" onDisconnect={() => window.location.reload()}>
                {(ready) =>
                    ready && (
                        <ReduxProvider
                            store={(() =>
                                store.current ??
                                (store.current = createClientStore('page', ExtensionContext.get().tabId)))()}
                        >
                            <OrganizationProvider>
                                <SettingsApp />
                            </OrganizationProvider>
                        </ReduxProvider>
                    )
                }
            </ExtensionApp>
        </>
    );
};
