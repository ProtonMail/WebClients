import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';

import { useIsGuest } from '../../providers/IsGuestProvider';
import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import { LibraryView } from './LibraryView';

jest.mock('../../providers/IsGuestProvider');
jest.mock('../../hooks/useLumoFlags', () => ({
    useLumoFlags: () => ({ nativeComposer: true, artifactsView: true, imageTools: true }),
}));
jest.mock('../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
jest.mock('../../providers/SidebarProvider', () => ({ useOptionalSidebar: () => ({ isVisible: false }) }));
jest.mock('../../providers/RightPanelProvider', () => ({ useOptionalRightPanel: () => ({ isOverlay: false }) }));
jest.mock('../../remote/nativeComposerBridgeHelpers');
jest.mock('../../layouts/LumoLayout', () => ({
    LumoLayoutWithDrawer: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('../../util/telemetry', () => ({ sendLibraryOpenedEvent: jest.fn() }));
jest.mock('../creations/hooks/useGeneratedGalleryCreations', () => ({
    useGeneratedGalleryCreations: () => ({ items: [], status: 'loaded' }),
}));
jest.mock('./useLibraryCreationEntries', () => ({ useLibraryCreationEntries: () => [] }));
jest.mock('./LibraryCreationsTab', () => ({ LibraryCreationsTab: () => null }));
jest.mock('./LibraryGuestSignInState', () => ({ LibraryGuestSignInState: () => null }));
jest.mock('../gallery/GalleryView', () => ({
    GalleryView: () => {
        const {
            useNativeComposerHostVisibilityApi,
        } = require('../../components/Composer/hooks/useNativeComposerVisibilityApi');
        useNativeComposerHostVisibilityApi();
        return null;
    },
}));

describe('Library native composer visibility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.defineProperty(navigator, 'userAgent', {
            configurable: true,
            value: 'ProtonLumo/2.2.0 (iPadOS 27.2; Apple iPad)',
        });
    });

    it.each([true, false])('hides chat input over the Library landing page (guest: %s)', (isGuest) => {
        (useIsGuest as jest.Mock).mockReturnValue(isGuest);

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
        (useIsGuest as jest.Mock).mockReturnValue(isGuest);
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
