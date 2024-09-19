import type { FC } from 'react';
import { type ComponentProps, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { APP_VERSION } from 'proton-pass-extension/app/config';
import { c, msgid } from 'ttag';

import { Avatar } from '@proton/atoms';
import { Icon, Tabs } from '@proton/components';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { PasswordUnlockProvider } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { PinUnlockProvider } from '@proton/pass/components/Lock/PinUnlockProvider';
import { OrganizationProvider, useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { Import } from '@proton/pass/components/Settings/Import';
import { AccountPath, UpsellRef } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import { clientSessionLocked } from '@proton/pass/lib/client';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import {
    selectPassPlan,
    selectPlanDisplayName,
    selectTrialDaysRemaining,
    selectUser,
} from '@proton/pass/store/selectors';
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

export const SettingsTabs: FC<{ pathname: string }> = ({ pathname }) => {
    const app = useAppState();
    const organization = useOrganization();
    const aliasesEnabled = useFeatureFlag(PassFeature.PassSimpleLoginAliasesSync);
    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD);
    const navigateToOrganization = useNavigateToAccount(AccountPath.POLICIES);

    const user = useSelector(selectUser);
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);
    const trialDaysLeft = useSelector(selectTrialDaysRemaining);

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

    if (app.state.authorized) {
        return (
            <OrganizationProvider>
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
            </OrganizationProvider>
        );
    }

    return (
        <div className="flex flex-column items-center justify-center my-auto">
            <Icon name="lock-filled" size={10} className="mb-4" />
            {clientSessionLocked(app.state.status) && (
                <>
                    <span className="block color-norm">{c('Info').t`Your ${PASS_APP_NAME} session is locked`}</span>
                    <span className="block text-sm color-weak">{c('Info')
                        .t`Unlock it with your PIN to access the settings`}</span>
                </>
            )}
        </div>
    );
};
