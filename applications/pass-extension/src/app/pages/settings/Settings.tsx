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
import { LockConfirmContextProvider } from '@proton/pass/components/Lock/LockConfirmContextProvider';
import { ApplicationLogs } from '@proton/pass/components/Settings/ApplicationLogs';
import { Import } from '@proton/pass/components/Settings/Import';
import {
    OrganizationProvider,
    useOrganization,
} from '@proton/pass/components/Settings/Organization/OrganizationProvider';
import { AccountPath, UpsellRef } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import { pageMessage } from '@proton/pass/lib/extension/message';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import {
    selectPassPlan,
    selectPlanDisplayName,
    selectTrialDaysRemaining,
    selectUser,
} from '@proton/pass/store/selectors';
import { AppStatus, type Unpack, WorkerMessageType, type WorkerMessageWithSender } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { Developer } from './Views/Developer';
import { Export } from './Views/Export';
import { General } from './Views/General';
import { Organization } from './Views/Organization';
import { Security } from './Views/Security';
import { Support } from './Views/Support';

import './Settings.scss';

type Tab = Unpack<Exclude<ComponentProps<typeof Tabs>['tabs'], undefined>>;

const getSettingsTabs: (isB2BAdmin: boolean, enableOrganization: boolean) => (Tab & { pathname: string })[] = (
    isB2BAdmin = false,
    enableOrganization = false
) => {
    const tabs = [
        {
            pathname: '/',
            title: c('Label').t`General`,
            content: <General />,
        },
        {
            pathname: '/security',
            title: c('Label').t`Security`,
            content: <Security />,
        },
        {
            pathname: '/import',
            title: c('Label').t`Import`,
            content: <Import />,
        },
        {
            pathname: '/export',
            title: c('Label').t`Export`,
            content: <Export />,
        },
        {
            pathname: '/support',
            title: c('Label').t`Support`,
            content: <Support />,
        },
        {
            pathname: '/account',
            title: c('Label').t`Account`,
            content: <></>,
        },
    ];

    if (ENV === 'development') {
        tabs.push({
            pathname: '/dev',
            title: 'Developer',
            content: <Developer />,
        });
    }
    if (enableOrganization && isB2BAdmin) {
        tabs.push({
            pathname: '/organization',
            title: c('Label').t`Organization`,
            content: <Organization />,
        });
    }

    return tabs;
};

const SettingsTabs: FC<{ pathname: string }> = ({ pathname }) => {
    const context = useExtensionConnect();
    const user = useSelector(selectUser);
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);
    const trialDaysLeft = useSelector(selectTrialDaysRemaining);
    const { isB2BAdmin } = useOrganization();
    const enableOrganization = useFeatureFlag(PassFeature.PassEnableOrganization) || true;
    const tabs = useMemo(() => getSettingsTabs(isB2BAdmin, enableOrganization), [isB2BAdmin, enableOrganization]);
    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD);

    const pathnameToIndex = (pathname: string) => {
        const idx = tabs.findIndex((tab) => tab.pathname === pathname);
        return idx !== -1 ? idx : 0;
    };

    const history = useHistory();
    const [activeTab, setActiveTab] = useState<number>(pathnameToIndex(pathname));

    const handleOnChange = (nextTab: number) => {
        if (tabs[nextTab].pathname === '/account') navigateToAccount();
        else history.push(tabs[nextTab].pathname);
    };

    useEffect(() => {
        setActiveTab(pathnameToIndex(pathname));
    }, [pathname]);

    if (context.state.loggedIn) {
        return (
            <>
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
            </>
        );
    }

    return (
        <div className="flex flex-column items-center justify-center my-auto">
            <Icon name="lock-filled" size={10} className="mb-4" />
            {context.state.status === AppStatus.LOCKED && (
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

    const handleWorkerMessage = useCallback((message: WorkerMessageWithSender) => {
        if (message.type === WorkerMessageType.NOTIFICATION && message.payload.notification.endpoint === 'page') {
            createNotification(message.payload.notification);
        }
    }, []);

    return (
        <OrganizationProvider>
            <Localized>
                <HashRouter>
                    <ExtensionConnect
                        endpoint="page"
                        messageFactory={pageMessage}
                        onWorkerMessage={handleWorkerMessage}
                    >
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
                                        <div className="max-h-full">
                                            <ApplicationLogs
                                                opened
                                                style={{ '--h-custom': 'max(calc(100vh - 130px), 18.75rem)' }}
                                            />
                                        </div>
                                    )}
                                />
                                <Route
                                    render={({ location: { pathname } }) => (
                                        <LockConfirmContextProvider>
                                            <SettingsTabs pathname={pathname} />
                                        </LockConfirmContextProvider>
                                    )}
                                />
                            </Switch>
                        </div>
                    </ExtensionConnect>
                </HashRouter>
            </Localized>
        </OrganizationProvider>
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
                            <SettingsApp />
                        </ReduxProvider>
                    )
                }
            </ExtensionApp>
        </>
    );
};
