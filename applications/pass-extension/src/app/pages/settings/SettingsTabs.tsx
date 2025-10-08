import type { ComponentProps, FC } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { SettingsFooter } from 'proton-pass-extension/app/pages/settings/SettingsFooter';
import { SettingsHeader } from 'proton-pass-extension/app/pages/settings/SettingsHeader';
import { ExtensionHead } from 'proton-pass-extension/lib/components/Extension/ExtensionHead';
import { useRequestFork } from 'proton-pass-extension/lib/hooks/useRequestFork';
import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import Tabs from '@proton/components/components/tabs/Tabs';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import type { OnReauthFn } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { PasswordUnlockProvider } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { PinUnlockProvider } from '@proton/pass/components/Lock/PinUnlockProvider';
import { OrganizationProvider, useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { Import } from '@proton/pass/components/Settings/Import';
import { UpsellingProvider } from '@proton/pass/components/Upsell/UpsellingProvider';
import { AccountPath } from '@proton/pass/constants';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import type { RequestForkData } from '@proton/pass/lib/auth/fork';
import { clientSessionLocked } from '@proton/pass/lib/client';
import { selectUser } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { Unpack } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { Aliases } from './Views/Aliases';
import { Developer } from './Views/Developer';
import { Export } from './Views/Export';
import { General } from './Views/General';
import { Security } from './Views/Security';
import { Support } from './Views/Support';

import './Settings.scss';

type Props = { pathname: string };
type Tab = Unpack<Exclude<ComponentProps<typeof Tabs>['tabs'], undefined>>;
type SettingTab = Tab & { path: string; hidden?: boolean };

const getSettingsTabs = (orgEnabled: boolean = false): SettingTab[] => [
    { path: '/', title: c('Label').t`General`, content: <General /> },
    { path: '/aliases', title: c('Label').t`Aliases`, content: <Aliases /> },
    { path: '/security', title: c('Label').t`Security`, content: <Security /> },
    { path: '/import', title: c('Label').t`Import`, content: <Import /> },
    { path: '/export', title: c('Label').t`Export`, content: <Export /> },
    { path: '/account', title: c('Label').t`Account`, icon: 'arrow-within-square', content: <></> },
    ...(orgEnabled
        ? [
              {
                  path: '/organization',
                  title: c('Label').t`Organization`,
                  icon: 'arrow-within-square',
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

export const SettingsTabs: FC<Props> = ({ pathname }) => {
    const { authorized, status } = useAppState();
    const organization = useOrganization();
    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD);
    const navigateToOrganization = useNavigateToAccount(AccountPath.POLICIES);
    const requestFork = useRequestFork();
    const store = useStore<State>();

    const tabs = useMemo(() => getSettingsTabs(organization?.settings.enabled), [organization]);

    const history = useHistory();
    const [activeTab, setActiveTab] = useState<number>(pathnameToIndex(pathname, tabs));

    const handleOnChange = (nextTab: number) => {
        if (tabs[nextTab].path === '/account') navigateToAccount();
        else if (tabs[nextTab].path === '/organization') navigateToOrganization();
        else history.push(tabs[nextTab].path);
    };

    useEffect(() => setActiveTab(pathnameToIndex(pathname, tabs)), [pathname, tabs]);

    const onReauth = useCallback<OnReauthFn>((reauth, fork) => {
        const user = selectUser(store.getState());
        const userID = user?.ID;
        const email = user?.Email;
        const data: RequestForkData = { type: 'reauth', userID, reauth };
        return requestFork({ ...fork, data, email, replace: true });
    }, []);

    if (authorized) {
        return (
            <OrganizationProvider>
                <PasswordUnlockProvider onReauth={onReauth}>
                    <PinUnlockProvider>
                        <UpsellingProvider>
                            <ExtensionHead title={c('Title').t`${PASS_APP_NAME} Settings`} />
                            <SettingsHeader />
                            <Tabs
                                className="w-full"
                                contentClassName="p-0"
                                navContainerClassName="mb-6"
                                onChange={handleOnChange}
                                tabs={tabs}
                                value={activeTab}
                            />
                            <SettingsFooter />
                        </UpsellingProvider>
                    </PinUnlockProvider>
                </PasswordUnlockProvider>
            </OrganizationProvider>
        );
    }

    return (
        <div className="flex flex-column items-center justify-center my-auto">
            <Icon name="lock-filled" size={10} className="mb-4" />
            {clientSessionLocked(status) && (
                <>
                    <span className="block color-norm">{c('Info').t`Your ${PASS_APP_NAME} session is locked`}</span>
                    <span className="block text-sm color-weak">{c('Info')
                        .t`Unlock it with your PIN to access the settings`}</span>
                </>
            )}
        </div>
    );
};
