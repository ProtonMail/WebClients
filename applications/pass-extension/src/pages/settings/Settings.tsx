import { type ComponentProps, type FC, useCallback, useEffect, useState } from 'react';
import { Provider as ReduxProvider, useSelector } from 'react-redux';
import { HashRouter, Route, Switch, useHistory } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, Tabs, useNotifications } from '@proton/components';
import { pageMessage } from '@proton/pass/extension/message';
import { selectPassPlan, selectPlanDisplayName, selectTrialDaysRemaining, selectUser } from '@proton/pass/store';
import { type Unpack, WorkerMessageType, type WorkerMessageWithSender, WorkerStatus } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { APP_VERSION } from '../../app/config';
import { ExtensionContextProvider, ExtensionWindow } from '../../shared/components/extension';
import { ExtensionHead } from '../../shared/components/page/ExtensionHead';
import { SessionLockConfirmContextProvider } from '../../shared/components/session-lock/SessionLockConfirmContextProvider';
import { UpgradeButton } from '../../shared/components/upgrade/UpgradeButton';
import { ExtensionContext } from '../../shared/extension';
import { useExtensionContext } from '../../shared/hooks';
import createClientStore from '../../shared/store/client-store';
import { Developer } from './views/Developer';
import { Export } from './views/Export';
import { General } from './views/General';
import { Import } from './views/Import';
import { Security } from './views/Security';
import { Support } from './views/Support';

import './Settings.scss';

type Tab = Unpack<Exclude<ComponentProps<typeof Tabs>['tabs'], undefined>>;

const SETTINGS_TABS: (Tab & { pathname: string })[] = [
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
];

if (ENV === 'development') {
    SETTINGS_TABS.push({
        pathname: '/dev',
        title: 'Developer',
        content: <Developer />,
    });
}

const SettingsTabs: FC<{ pathname: string }> = ({ pathname }) => {
    const context = useExtensionContext();
    const user = useSelector(selectUser);
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);
    const trialDaysLeft = useSelector(selectTrialDaysRemaining);

    const pathnameToIndex = (pathname: string) => {
        const idx = SETTINGS_TABS.findIndex((tab) => tab.pathname === pathname);
        return idx !== -1 ? idx : 0;
    };

    const history = useHistory();
    const [activeTab, setActiveTab] = useState<number>(pathnameToIndex(pathname));

    const handleOnChange = (nextTab: number) => history.push(SETTINGS_TABS[nextTab].pathname);

    useEffect(() => {
        setActiveTab(pathnameToIndex(pathname));
    }, [pathname]);

    if (context.state.loggedIn) {
        return (
            <>
                <div className="mb-8">
                    <div className="flex w100 flex-justify-space-between flex-align-items-start">
                        <div className="flex flex-align-items-start">
                            <Avatar className="mr-2 mt-1">{user?.DisplayName?.toUpperCase()?.[0]}</Avatar>
                            <span>
                                <span className="block text-semibold text-ellipsis">{user?.DisplayName}</span>
                                <span className="block text-sm text-ellipsis">{user?.Email}</span>
                                <span className="block color-weak text-sm text-italic">{planDisplayName}</span>
                            </span>
                        </div>
                        <div className="flex flex-align-items-end flex-column">
                            {passPlan !== UserPassPlan.PLUS && (
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
                                    <UpgradeButton inline />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <Tabs
                    className="w100"
                    contentClassName="p-0"
                    navContainerClassName="mb-6"
                    onChange={handleOnChange}
                    tabs={SETTINGS_TABS}
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
        <div className="flex flex-column flex-align-items-center flex-justify-center my-auto">
            <Icon name="lock-filled" size={42} className="mb-4" />
            {context.state.status === WorkerStatus.LOCKED && (
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
        if (message.type === WorkerMessageType.NOTIFICATION && message.payload.notification.receiver === 'page') {
            createNotification(message.payload.notification);
        }
    }, []);

    return (
        <ReduxProvider store={createClientStore('page', ExtensionContext.get().tabId)}>
            <HashRouter>
                <ExtensionContextProvider
                    endpoint="page"
                    messageFactory={pageMessage}
                    onWorkerMessage={handleWorkerMessage}
                >
                    <div
                        className="pass-settings flex flex-column ui-standard w100 p-4 mx-auto bg-weak min-h-custom"
                        style={{ '--min-height-custom': '100vh' }}
                    >
                        <Switch>
                            <Route
                                render={({ location: { pathname } }) => (
                                    <SessionLockConfirmContextProvider>
                                        <SettingsTabs pathname={pathname} />
                                    </SessionLockConfirmContextProvider>
                                )}
                            />
                        </Switch>
                    </div>
                </ExtensionContextProvider>
            </HashRouter>
        </ReduxProvider>
    );
};

export const Settings: FC = () => (
    <>
        <ExtensionHead title={c('Title').t`${PASS_APP_NAME} Settings`} />
        <ExtensionWindow endpoint="page">{(ready) => (ready ? <SettingsApp /> : <CircleLoader />)}</ExtensionWindow>
    </>
);
