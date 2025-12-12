import type { ReactNode } from 'react';

import { DriveIndexingProvider } from '../providers/DriveIndexingProvider';
import { GhostChatProvider } from '../providers/GhostChatProvider';
import { SidebarProvider, useSidebar } from '../providers/SidebarProvider';
import { SearchModalProvider, useSearchModal } from '../providers/SearchModalProvider';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import HighLoadWarning from './components/HighLoadWarning';
import LumoSidebar from './sidebar/LumoSidebar';

export type ActivePanel = 'chatHistory' | 'favoriteChats' | null;

interface Props {
    children: ReactNode;
    HeaderComponent: React.ComponentType<any>;
}

const MainLayoutContent = ({ children, HeaderComponent }: Props) => {
    const { isSmallScreen } = useSidebar();
    const { openSearchModal } = useSearchModal();
    
    // Set up keyboard shortcuts
    useKeyboardShortcuts({ onOpenSearch: openSearchModal });

    return (
        <div className="relative reset4print flex flex-row h-full w-full overflow-hidden">
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
                <SearchModalProvider>
                    <DriveIndexingProvider>
                        <MainLayoutContent children={children} HeaderComponent={HeaderComponent} />
                    </DriveIndexingProvider>
                </SearchModalProvider>
            </SidebarProvider>
        </GhostChatProvider>
    );
};
