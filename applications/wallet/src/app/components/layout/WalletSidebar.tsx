import { memo } from 'react';

import { AppVersion, AppsDropdown, MainLogo, Sidebar, SidebarNav } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import changelog from '../../../../CHANGELOG.md';

interface Props {
    expanded?: boolean;
}

const WalletSidebar = ({ expanded = false }: Props) => {
    return (
        <>
            <Sidebar
                expanded={expanded}
                appsDropdown={<AppsDropdown app={APPS.PROTONWALLET} />}
                logo={<MainLogo to="/" data-testid="main-logo" />}
                version={<AppVersion changelog={changelog} />}
            >
                <SidebarNav className="flex">
                    <div className="flex-item-noshrink"></div>
                </SidebarNav>
            </Sidebar>
        </>
    );
};

export default memo(WalletSidebar);
