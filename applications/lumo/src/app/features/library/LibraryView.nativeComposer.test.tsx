import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useNativeComposerHostVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import { LibraryView } from './LibraryView';

vi.mock('../../providers/IsGuestProvider');
vi.mock('../../hooks/useLumoFlags', () => ({
    useLumoFlags: () => ({ nativeComposer: true, artifactsView: true, imageTools: true }),
}));
vi.mock('../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
vi.mock('../../providers/SidebarProvider', () => ({ useOptionalSidebar: () => ({ isVisible: false }) }));
vi.mock('../../providers/RightPanelProvider', () => ({ useOptionalRightPanel: () => ({ isOverlay: false }) }));
vi.mock('../../remote/nativeComposerBridgeHelpers');
vi.mock('../../layouts/LumoLayout', () => ({
    LumoLayoutWithDrawer: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../../util/telemetry', () => ({ sendLibraryOpenedEvent: vi.fn() }));
vi.mock('../creations/hooks/useGeneratedGalleryCreations', () => ({
    useGeneratedGalleryCreations: () => ({ items: [], status: 'loaded' }),
}));
vi.mock('./useLibraryCreationEntries', () => ({ useLibraryCreationEntries: () => [] }));
vi.mock('./LibraryCreationsTab', () => ({ LibraryCreationsTab: () => null }));
vi.mock('./LibraryGuestSignInState', () => ({ LibraryGuestSignInState: () => null }));
vi.mock('../gallery/GalleryView', () => ({
    GalleryView: () => {
        useNativeComposerHostVisibilityApi();
        return null;
    },
}));

describe('Library native composer visibility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(navigator, 'userAgent', {
            configurable: true,
            value: 'ProtonLumo/2.2.0 (iPadOS 27.2; Apple iPad)',
        });
    });

    it.each([true, false])('hides chat input over the Library landing page (guest: %s)', (isGuest) => {
        (useIsGuest as Mock).mockReturnValue(isGuest);

        const { unmount } = render(
            <MemoryRouter>
                <LibraryView isProcessingAttachment={false} />
            </MemoryRouter>
        );

        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
        unmount();
        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
    });

    it.each([true, false])('only allows image input for a signed-in Images tab (guest: %s)', (isGuest) => {
        (useIsGuest as Mock).mockReturnValue(isGuest);
        render(
            <MemoryRouter>
                <LibraryView isProcessingAttachment={false} />
            </MemoryRouter>
        );
        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

        fireEvent.click(screen.getByRole('tab', { name: 'Images' }));

        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(!isGuest);

        fireEvent.click(screen.getByRole('tab', { name: /^Creations/ }));

        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
    });
});
