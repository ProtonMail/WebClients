import type { FC } from 'react';
import { type ComponentProps, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { SettingsFooter } from 'proton-pass-extension/app/pages/settings/SettingsFooter';
import { SettingsHeader } from 'proton-pass-extension/app/pages/settings/SettingsHeader';
import { c } from 'ttag';

import { Icon, Tabs } from '@proton/components';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { PasswordUnlockProvider } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { PinUnlockProvider } from '@proton/pass/components/Lock/PinUnlockProvider';
import { OrganizationProvider, useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { Import } from '@proton/pass/components/Settings/Import';
import { UpsellingProvider } from '@proton/pass/components/Upsell/UpsellingProvider';
import { AccountPath } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import { clientSessionLocked } from '@proton/pass/lib/client';
import { type Unpack } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
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

export const SettingsTabs: FC<Props> = ({ pathname }) => {
    const { authorized, status } = useAppState();
    const organization = useOrganization();
    const aliasesEnabled = useFeatureFlag(PassFeature.PassSimpleLoginAliasesSync);
    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD);
    const navigateToOrganization = useNavigateToAccount(AccountPath.POLICIES);

    const tabs = useMemo(
        () => getSettingsTabs(organization?.settings.enabled, aliasesEnabled),
        [organization, aliasesEnabled]
    );

    const history = useHistory();
    const [activeTab, setActiveTab] = useState<number>(pathnameToIndex(pathname, tabs));

    const handleOnChange = (nextTab: number) => {
        if (tabs[nextTab].path === '/account') navigateToAccount();
        else if (tabs[nextTab].path === '/organization') navigateToOrganization();
        else history.push(tabs[nextTab].path);
    };

    useEffect(() => setActiveTab(pathnameToIndex(pathname, tabs)), [pathname, tabs]);

    if (authorized) {
        return (
            <OrganizationProvider>
                <PasswordUnlockProvider>
                    <PinUnlockProvider>
                        <UpsellingProvider>
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
