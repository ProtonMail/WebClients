import { type ComponentProps, type FC, useEffect, useMemo, useState } from 'react';
import { type RouteChildrenProps } from 'react-router-dom';

import { c } from 'ttag';

import { Tabs } from '@proton/components/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { Import } from '@proton/pass/components/Settings/Import';
import { AccountPath } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import type { Unpack } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { Aliases } from './Tabs/Aliases';
import { Export } from './Tabs/Export';
import { General } from './Tabs/General';
import { Security } from './Tabs/Security';
import { Support } from './Tabs/Support';

import './Settings.scss';

type SettingTab = Unpack<Exclude<ComponentProps<typeof Tabs>['tabs'], undefined>> & { hash: string };

const getSettingsTabs = (orgEnabled: boolean = false, aliasesEnabled: boolean = false): SettingTab[] => [
    { hash: 'general', title: c('Label').t`General`, content: <General /> },
    ...(aliasesEnabled ? [{ hash: 'aliases', title: c('Label').t`Aliases`, content: <Aliases /> }] : []),
    { hash: 'security', title: c('Label').t`Security`, content: <Security /> },
    { hash: 'import', title: c('Label').t`Import`, content: <Import /> },
    { hash: 'export', title: c('Label').t`Export`, content: <Export /> },
    { hash: 'account', title: c('Label').t`Account`, icon: 'arrow-out-square', content: <></> },
    ...(orgEnabled
        ? [
              {
                  hash: 'organization',
                  title: c('Label').t`Organization`,
                  icon: 'arrow-out-square',
                  content: <></>,
              } as const,
          ]
        : []),
    { hash: 'support', title: c('Label').t`Support`, content: <Support /> },
];

const pathnameToIndex = (tabs: SettingTab[], hash: string) => {
    const idx = tabs.findIndex((tab) => tab.hash === hash);
    return idx !== -1 ? idx : 0;
};

export const SettingsTabs: FC<RouteChildrenProps> = (props) => {
    const { openSettings } = usePassCore();
    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD);
    const navigateToOrganization = useNavigateToAccount(AccountPath.POLICIES);
    const pathname = props.location.hash?.substring(1, props.location.hash.length);

    const organization = useOrganization();
    const aliasesEnabled = useFeatureFlag(PassFeature.PassSimpleLoginAliasesSync);

    const tabs = useMemo(() => getSettingsTabs(organization?.settings.enabled, aliasesEnabled), [organization]);
    const [activeTab, setActiveTab] = useState<number>(pathnameToIndex(tabs, pathname));

    const handleOnChange = (nextTab: number) => {
        if (tabs[nextTab].hash === 'account') navigateToAccount();
        else if (tabs[nextTab].hash === 'organization') navigateToOrganization();
        else openSettings?.(tabs[nextTab].hash);
    };

    useEffect(() => setActiveTab(pathnameToIndex(tabs, pathname)), [pathname]);

    return (
        <Tabs
            className="w-full shrink-0"
            contentClassName="p-0"
            navContainerClassName="pass-settings--tabs mb-2 pt-4 sticky top-0"
            onChange={handleOnChange}
            tabs={tabs}
            value={activeTab}
        />
    );
};

export const Settings: FC<RouteChildrenProps> = (props) => {
    const { config } = usePassCore();
    return (
        <div
            className="flex flex-column gap-2 flex-nowrap justify-space-between w-full h-full px-4 overflow-auto"
            style={{ '--max-w-custom': '50em' }}
        >
            <SettingsTabs {...props} />

            <div className="justify-end shrink-0 pb-3">
                <hr className="mb-2" />
                <span className="text-xs color-weak">
                    {PASS_APP_NAME} v{config.APP_VERSION}
                </span>
            </div>
        </div>
    );
};
