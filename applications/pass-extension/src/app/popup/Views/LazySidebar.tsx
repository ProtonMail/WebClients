import { useExtensionClient } from 'proton-pass-extension/lib/components/Extension/ExtensionClient';

import { Sidebar } from '@proton/pass/components/Layout/Section/Sidebar';
import { MenuSidebar } from '@proton/pass/components/Menu/Sidebar/MenuSidebar';
import { MenuUserPanel } from '@proton/pass/components/Menu/Sidebar/MenuUserPanel';

const LazySidebar = () => {
    const { lock, logout } = useExtensionClient();

    return (
        <Sidebar>
            <MenuSidebar
                onLock={lock}
                onLogout={logout}
                userPanel={
                    <div className="px-2 py-1.5">
                        <MenuUserPanel />
                    </div>
                }
            />
        </Sidebar>
    );
};

export default LazySidebar;
