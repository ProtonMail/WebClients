import { type ComponentProps, type FC, useEffect, useMemo, useState } from 'react';
import { type RouteChildrenProps } from 'react-router-dom';

import { c } from 'ttag';

import { Tabs } from '@proton/components/components';
import { useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import { LockConfirmContextProvider } from '@proton/pass/components/Lock/LockConfirmContextProvider';
import { type Unpack } from '@proton/pass/types';

import { Security } from './Tabs/Security';
import { Support } from './Tabs/Support';

import './Settings.scss';

type SettingTab = Unpack<Exclude<ComponentProps<typeof Tabs>['tabs'], undefined>> & { pathname: string };

const getSettingsTabs: () => SettingTab[] = () => {
    const tabs = [
        {
            pathname: 'security',
            title: c('Label').t`Security`,
            content: <Security />,
        },
        {
            pathname: 'support',
            title: c('Label').t`Support`,
            content: <Support />,
        },
    ];

    return tabs;
};

const pathnameToIndex = (tabs: SettingTab[], pathname: string) => {
    const idx = tabs.findIndex((tab) => tab.pathname === pathname);
    return idx !== -1 ? idx : 0;
};

export const SettingsTabs: FC<RouteChildrenProps> = (props) => {
    const { navigate } = useNavigation();
    const pathname = props.location.hash?.substring(1, props.location.hash.length);
    const base = props.match?.path!;

    const tabs = useMemo(getSettingsTabs, []);
    const [activeTab, setActiveTab] = useState<number>(pathnameToIndex(tabs, pathname));

    const handleOnChange = (nextTab: number) => navigate(base, { hash: tabs[nextTab].pathname, mode: 'replace' });
    useEffect(() => setActiveTab(pathnameToIndex(tabs, pathname)), [pathname]);

    return (
        <Tabs
            className="w-full"
            contentClassName="p-0"
            navContainerClassName="pass-settings--tabs mb-2"
            onChange={handleOnChange}
            tabs={tabs}
            value={activeTab}
        />
    );
};

export const Settings: FC<RouteChildrenProps> = (props) => {
    return (
        <div className="pass-settings flex flex-column w-full p-4 h-full">
            <LockConfirmContextProvider>
                <SettingsTabs {...props} />
            </LockConfirmContextProvider>
        </div>
    );
};
