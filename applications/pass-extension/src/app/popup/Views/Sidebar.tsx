import { Sidebar as CoreSideBar } from '@proton/pass/components/Layout/Section/Sidebar';
import { MenuSidebar } from '@proton/pass/components/Menu/Sidebar/MenuSidebar';
import { MenuUserPanel } from '@proton/pass/components/Menu/Sidebar/MenuUserPanel';

import { useExtensionClient } from '../../../lib/components/Extension/ExtensionClient';

export const Sidebar = () => {
    const { lock, logout } = useExtensionClient();

    return (
        <CoreSideBar>
            <MenuSidebar
                onLock={lock}
                onLogout={logout}
                userPanel={
                    <div className="px-2 py-1.5">
                        <MenuUserPanel />
                    </div>
                }
            />
        </CoreSideBar>
    );
};
