import type { ReactNode } from 'react';

import { GhostChatProvider } from '../providers/GhostChatProvider';
import { SidebarProvider, useSidebar } from '../providers/SidebarProvider';
import HighLoadWarning from './components/HighLoadWarning';
import { Background } from './components/LumoBackground/Background';
import LumoSidebar from './sidebar/LumoSidebar';

export type ActivePanel = 'chatHistory' | 'favoriteChats' | null;

interface Props {
    children: ReactNode;
    HeaderComponent: React.ComponentType<any>;
}

const MainLayoutContent = ({ children, HeaderComponent }: Props) => {
    const { isSmallScreen } = useSidebar();
    return (
        <div className="relative reset4print flex flex-row h-full w-full overflow-hidden">
            <Background />
            <div className="absolute top-0 left-0 w-full h-full no-print">
                <div className="flex flex-column flex-nowrap h-full flex-1 reset4print">
                    {!isSmallScreen && <HeaderComponent />}
                    <div className="flex flex-row flex-nowrap flex-1 min-h-0 w-full reset4print relative">
                        <LumoSidebar />
                        <main className="flex-1 flex flex-column flex-nowrap border-top border-weak reset4print">
                            <HighLoadWarning />
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MainLayout = ({ children, HeaderComponent }: Props) => {
    return (
        <GhostChatProvider>
            <SidebarProvider>
                <MainLayoutContent children={children} HeaderComponent={HeaderComponent} />
            </SidebarProvider>
        </GhostChatProvider>
    );
};
