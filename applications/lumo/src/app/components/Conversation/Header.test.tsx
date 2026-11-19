import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';

import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { useAttentionKeys } from '../../providers/ConversationAttentionProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { SpaceType } from '../../types';
import { Header } from './Header';

let mockHasLumoPlus = false;
let mockIsSmallScreen = false;
let mockShowSchedules = false;

jest.mock('../../providers/ConversationAttentionProvider', () => ({
    ...jest.requireActual('../../providers/ConversationAttentionProvider'),
    useAttentionKeys: jest.fn(),
}));

jest.mock('../../providers/SidebarProvider', () => ({ useSidebar: jest.fn() }));
jest.mock('../../providers/LumoPlanProvider', () => ({
    useLumoPlan: () => ({ hasLumoPlus: mockHasLumoPlus }),
}));
jest.mock('../../layouts/sidebar/hooks/useSidebarVisibility', () => ({
    useSidebarVisibility: () => ({
        isGuest: false,
        isSmallScreen: mockIsSmallScreen,
        showSchedules: mockShowSchedules,
    }),
}));

const pending = {
    isVisible: false,
    attention: 'approval:request',
    showsDot: true,
    isExpired: false,
    isLoaded: true,
    hasLumoPlus: false,
    isSmallScreen: false,
    showSchedules: false,
    showProjectConversationsInHistory: false,
    spaceType: SpaceType.Default as SpaceType,
} as const;

it.each([
    { ...pending, name: 'hidden with unseen attention' },
    { ...pending, name: 'hidden with seen attention', attention: undefined, showsDot: false },
    { ...pending, name: 'visible with unseen attention', isVisible: true, showsDot: false },
    { ...pending, name: 'hidden with a Free chat outside retention', isExpired: true, showsDot: false },
    { ...pending, name: 'hidden with an older Plus chat', isExpired: true, hasLumoPlus: true },
    { ...pending, name: 'hidden with an unloaded chat', isLoaded: false, showsDot: false },
    {
        ...pending,
        name: 'hidden with the Scheduled section enabled',
        spaceType: SpaceType.Schedule,
        showSchedules: true,
    },
    { ...pending, name: 'hidden with the Scheduled section disabled', spaceType: SpaceType.Schedule, showsDot: false },
    { ...pending, name: 'hidden with a desktop project', spaceType: SpaceType.Project },
    {
        ...pending,
        name: 'hidden with a small-screen project excluded from history',
        spaceType: SpaceType.Project,
        isSmallScreen: true,
        showsDot: false,
    },
    {
        ...pending,
        name: 'hidden with a small-screen project included in history',
        spaceType: SpaceType.Project,
        isSmallScreen: true,
        showProjectConversationsInHistory: true,
    },
])(
    'handles a sidebar that is $name',
    ({
        isVisible,
        attention,
        showsDot,
        isExpired,
        isLoaded,
        hasLumoPlus,
        isSmallScreen,
        showSchedules,
        showProjectConversationsInHistory,
        spaceType,
    }) => {
        const toggle = jest.fn();
        mockHasLumoPlus = hasLumoPlus;
        mockIsSmallScreen = isSmallScreen;
        mockShowSchedules = showSchedules;
        jest.mocked(useSidebar).mockReturnValue({
            isVisible,
            toggle,
            isSmallScreen,
            smallScreenMode: 'hidden',
            largeScreenMode: isVisible ? 'expanded' : 'hidden',
            animateTransitions: false,
            closeOverlay: jest.fn(),
            closeOnItemClick: jest.fn(),
        });
        jest.mocked(useAttentionKeys).mockReturnValue({
            byConversation: new Map([['chat', attention]]),
            bySpace: new Map(),
        });

        const store = configureStore({
            reducer: () => ({
                conversations: isLoaded
                    ? {
                          chat: {
                              id: 'chat',
                              spaceId: 'space',
                              createdAt: new Date(isExpired ? 0 : Date.now()).toISOString(),
                          },
                      }
                    : {},
                spaces: { space: { spaceType } },
                lumoUserSettings: { showProjectConversationsInHistory },
            }),
        });

        render(
            <Provider store={store} context={ProtonStoreContext}>
                <Header showNewChatButton={false} withoutDrawerToggle>
                    Chat
                </Header>
            </Provider>
        );

        const button = screen.getByRole('button', { name: isVisible ? /Close sidebar/ : /Show sidebar/ });
        expect(Boolean(button.querySelector('.status-dot--accent'))).toBe(showsDot);
        expect(Boolean(button.querySelector('.sidebar-toggle-icon--badged svg'))).toBe(showsDot);
        if (showsDot) {
            expect(button).toHaveAccessibleName(/Show sidebar.*A chat needs your attention/);
        }
        fireEvent.click(button);
        expect(toggle).toHaveBeenCalledTimes(1);
    }
);
