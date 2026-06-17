import { type ReactNode, lazy } from 'react';

import HighLoadWarning from '../components/Notifications/HighLoadWarning';
import { RightDrawer } from '../components/RightDrawer';
import { useGuestMigrationNotification } from '../components/useGuestMigrationNotification';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useResourceLimitNotifications } from '../hooks/useResourceLimitNotifications';
import { GhostChatProvider } from '../providers/GhostChatProvider';
import { useIsGuest } from '../providers/IsGuestProvider';
import { RightPanelProvider, useRightPanel } from '../providers/RightPanelProvider';
import { SearchModalProvider, useSearchModal } from '../providers/SearchModalProvider';
import { SidebarProvider } from '../providers/SidebarProvider';
import LumoSidebar from './sidebar/LumoSidebar';
import { MainLayoutAnimatedBackground } from './MainLayoutAnimatedBackground';

import './MainLayout.scss';

export type ActivePanel = 'chatHistory' | 'favoriteChats' | null;

interface Props {
    children: ReactNode;
}

const MainLayoutContent = ({ children }: Props) => {
    const { openSearchModal } = useSearchModal();
    const { isOpen, toggle } = useRightPanel();

    useGuestMigrationNotification();
    useResourceLimitNotifications();

    useKeyboardShortcuts({ onOpenSearch: openSearchModal });

    return (
        <div className="outer-layout-background relative reset4print flex flex-row h-full w-full overflow-hidden">
            <div className="inner-layout-background absolute top-0 left-0 w-full h-full no-print">
                <div className="flex flex-column flex-nowrap h-full flex-1 reset4print">
                    <div className="main-layout-component flex flex-row flex-nowrap flex-1 min-h-0 w-full reset4print relative md:p-2 md:gap-2">
                        <LumoSidebar />
                        <main className="flex-1 flex flex-column flex-nowrap reset4print md:rounded-xl relative overflow-hidden">
                            <MainLayoutAnimatedBackground />
                            <HighLoadWarning />
                            {children}
                        </main>
                        {isOpen && <RightDrawer onClose={toggle} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DriveIndexingProviderLazy = lazy(() =>
    import('../providers/DriveIndexingProvider').then((m) => ({ default: m.DriveIndexingProvider }))
);

export const MainLayout = ({ children }: Props) => {
    const isGuest = useIsGuest();
    return (
        <GhostChatProvider>
            <SidebarProvider>
                <SearchModalProvider>
                    <RightPanelProvider>
                        {!isGuest ? (
                            <DriveIndexingProviderLazy>
                                <MainLayoutContent children={children} />
                            </DriveIndexingProviderLazy>
                        ) : (
                            <MainLayoutContent children={children} />
                        )}
                    </RightPanelProvider>
                </SearchModalProvider>
            </SidebarProvider>
        </GhostChatProvider>
    );
};
