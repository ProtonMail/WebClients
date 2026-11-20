import type { ReactNode } from 'react';

import { render } from '@testing-library/react';

import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import { AllChatsView } from './AllChatsView';

vi.mock('../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ nativeComposer: true }) }));
vi.mock('../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
vi.mock('../../hooks/useIsChatHistoryHydrating', () => ({ useIsChatHistoryHydrating: () => false }));
vi.mock('../../hooks/useLumoPlan', () => ({ useLumoPlan: () => ({ hasLumoPlus: false }) }));
vi.mock('../../providers/SidebarProvider', () => ({ useOptionalSidebar: () => ({ isVisible: true }) }));
vi.mock('../../providers/RightPanelProvider', () => ({ useOptionalRightPanel: () => ({ isOpen: false }) }));
vi.mock('../../redux/hooks', () => ({
    useLumoStore: () => ({ getState: () => ({}) }),
    useLumoSelector: () => ({}),
}));
vi.mock('../../remote/nativeComposerBridgeHelpers');
vi.mock('../../layouts/LumoLayout', () => ({
    LumoLayoutWithDrawer: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('./AllChatsHeaderSearch', () => ({ AllChatsHeaderSearch: () => null }));
vi.mock('./AllChatsHeaderNewChatButton', () => ({ AllChatsHeaderNewChatButton: () => null }));
vi.mock('./shared/ConversationListPanel', () => ({ ConversationListPanel: () => null }));
vi.mock('./shared/AllChatsHeader', () => ({ AllChatsTitle: () => null }));
vi.mock('./shared/AllChatsEmptyState', () => ({ AllChatsEmptyState: () => null }));

describe('All chats native composer visibility', () => {
    it('hides the native input over the list and restores it when leaving', () => {
        Object.defineProperty(navigator, 'userAgent', {
            configurable: true,
            value: 'ProtonLumo/2.2.0 (iPadOS 27.2; Apple iPad)',
        });
        const { unmount } = render(<AllChatsView />);

        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

        unmount();
        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
    });
});
