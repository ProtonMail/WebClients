import type { ReactNode } from 'react';

import { render } from '@testing-library/react';

import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import { AllChatsView } from './AllChatsView';

jest.mock('../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ nativeComposer: true }) }));
jest.mock('../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
jest.mock('../../hooks/useIsChatHistoryHydrating', () => ({ useIsChatHistoryHydrating: () => false }));
jest.mock('../../hooks/useLumoPlan', () => ({ useLumoPlan: () => ({ hasLumoPlus: false }) }));
jest.mock('../../providers/SidebarProvider', () => ({ useOptionalSidebar: () => ({ isVisible: true }) }));
jest.mock('../../providers/RightPanelProvider', () => ({ useOptionalRightPanel: () => ({ isOpen: false }) }));
jest.mock('../../redux/hooks', () => ({
    useLumoStore: () => ({ getState: () => ({}) }),
    useLumoSelector: () => ({}),
}));
jest.mock('../../remote/nativeComposerBridgeHelpers');
jest.mock('../../layouts/LumoLayout', () => ({
    LumoLayoutWithDrawer: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('./AllChatsHeaderSearch', () => ({ AllChatsHeaderSearch: () => null }));
jest.mock('./AllChatsHeaderNewChatButton', () => ({ AllChatsHeaderNewChatButton: () => null }));
jest.mock('./shared/ConversationListPanel', () => ({ ConversationListPanel: () => null }));
jest.mock('./shared/AllChatsHeader', () => ({ AllChatsTitle: () => null }));
jest.mock('./shared/AllChatsEmptyState', () => ({ AllChatsEmptyState: () => null }));

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
