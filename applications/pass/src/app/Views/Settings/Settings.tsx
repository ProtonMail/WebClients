import { type ComponentProps, type FC, useEffect, useMemo, useState } from 'react';
import { type RouteChildrenProps } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, Tabs } from '@proton/components/components';
import { useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Core/routing';
import { LockConfirmContextProvider } from '@proton/pass/components/Lock/LockConfirmContextProvider';
import { type Unpack } from '@proton/pass/types';

import { Security } from './Tabs/Security';
import { Support } from './Tabs/Support';

type Tab = Unpack<Exclude<ComponentProps<typeof Tabs>['tabs'], undefined>>;

const getSettingsTabs: () => (Tab & { pathname: string })[] = () => {
    const tabs = [
        {
            // TODO: use pathname: '/security' once we have General tab
            pathname: '',
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

export const SettingsTabs: FC<RouteChildrenProps> = (props) => {
    const tabs = useMemo(getSettingsTabs, []);

    const pathnameToIndex = (pathname: string) => {
        const idx = tabs.findIndex((tab) => tab.pathname === pathname);
        return idx !== -1 ? idx : 0;
    };

    const { navigate } = useNavigation();
    const pathname = props.location.hash?.substring(1, props.location.hash.length);
    const [activeTab, setActiveTab] = useState<number>(pathnameToIndex(pathname));
    const base = props.match?.path!;

    const handleOnChange = (nextTab: number) => navigate(base, { hash: tabs[nextTab].pathname, mode: 'replace' });
    const handleOnClose = () => navigate(getLocalPath());

    useEffect(() => {
        setActiveTab(pathnameToIndex(pathname));
    }, [pathname]);

    return (
        <>
            <div className="flex flex-align-items-center mb-8 gap-2">
                <Button className="flex-item-noshrink" icon pill shape="solid" onClick={handleOnClose}>
                    <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                </Button>
                <h1 className="h3 text-bold">{c('Title').t`Settings`}</h1>
            </div>

            <Tabs
                className="w-full"
                contentClassName="p-0"
                navContainerClassName="mb-6"
                onChange={handleOnChange}
                tabs={tabs}
                value={activeTab}
            />
        </>
    );
};

export const Settings: FC<RouteChildrenProps> = (props) => {
    return (
        <div
            className="pass-settings flex flex-column w-full p-4 mx-auto min-h-custom"
            style={{ '--min-h-custom': '100vh' }}
        >
            <LockConfirmContextProvider>
                <SettingsTabs {...props} />
            </LockConfirmContextProvider>
        </div>
    );
};
