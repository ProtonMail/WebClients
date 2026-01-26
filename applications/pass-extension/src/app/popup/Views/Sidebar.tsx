import { useExtensionClient } from 'proton-pass-extension/lib/components/Extension/ExtensionClient';

import { Sidebar as CoreSideBar } from '@proton/pass/components/Layout/Section/Sidebar';
import { MenuSidebar } from '@proton/pass/components/Menu/Sidebar/MenuSidebar';
import { MenuUserPanel } from '@proton/pass/components/Menu/Sidebar/MenuUserPanel';

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
