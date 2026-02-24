import { type ReactNode, lazy } from 'react';

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { GhostChatProvider } from '../providers/GhostChatProvider';
import { useIsGuest } from '../providers/IsGuestProvider';
import { SearchModalProvider, useSearchModal } from '../providers/SearchModalProvider';
import { SidebarProvider, useSidebar } from '../providers/SidebarProvider';
import HighLoadWarning from '../components/Notifications/HighLoadWarning';
import { PrivateHeader } from './header/PrivateHeader';
import { PublicHeader } from './header/PublicHeader';
import LumoSidebar from './sidebar/LumoSidebar';

export type ActivePanel = 'chatHistory' | 'favoriteChats' | null;

interface Props {
    children: ReactNode;
}

const MainLayoutContent = ({ children }: Props) => {
    const { isSmallScreen } = useSidebar();
    const { openSearchModal } = useSearchModal();
    const isGuest = useIsGuest();

    // Set up keyboard shortcuts
    useKeyboardShortcuts({ onOpenSearch: openSearchModal });
    const HeaderComponent = isGuest ? PublicHeader : PrivateHeader;

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

const DriveIndexingProviderLazy = lazy(() =>
    import('../providers/DriveIndexingProvider').then((m) => ({ default: m.DriveIndexingProvider }))
);

export const MainLayout = ({ children }: Props) => {
    const isGuest = useIsGuest();
    return (
        <GhostChatProvider>
            <SidebarProvider>
                <SearchModalProvider>
                    {!isGuest ? (
                        <DriveIndexingProviderLazy>
                            <MainLayoutContent children={children} />
                        </DriveIndexingProviderLazy>
                    ) : (
                        <MainLayoutContent children={children} />
                    )}
                </SearchModalProvider>
            </SidebarProvider>
        </GhostChatProvider>
    );
};
