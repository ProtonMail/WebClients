import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import type { NotificationsManager } from '@proton/app-context/notifications/manager';
import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext';
import { chatAndReactionsReducer } from '@proton/meet/store/slices/chatAndReactionsSlice';
import {
    initialState as initialParticipantsState,
    participantsReducer,
} from '@proton/meet/store/slices/participants/participantsSlice';
import { sortedParticipantsReducer } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import type { MeetChatMessage, ParticipantEventRecord } from '@proton/meet/types/types';
import { ParticipantEvent } from '@proton/meet/types/types';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { ChatItem } from './ChatItem';

vi.mock('@livekit/components-react', () => ({
    useLocalParticipant: () => ({ localParticipant: { identity: 'local-user' } }),
    useRoomContext: () => ({ localParticipant: { identity: 'local-user' } }),
}));

const mockSendReaction = vi.fn();

vi.mock('../../hooks/bridges/useChatMessageReaction', () => ({
    useChatMessageReaction: () => mockSendReaction,
}));

const flagMocks = vi.hoisted(() => ({ enabledFlags: new Set<string>() }));
vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: (flag: string) => flagMocks.enabledFlags.has(flag),
}));

vi.mock('@proton/atoms/Popper/usePopper', () => ({
    usePopper: () => ({
        floating: () => {},
        reference: () => {},
        position: { top: 0, left: 0 },
        arrow: {},
        placement: 'bottom',
        availableSize: undefined,
        update: () => {},
    }),
}));

interface ObservedIntersection {
    callback: IntersectionObserverCallback;
    targets: Element[];
    isDisconnected: boolean;
}

let intersectionObservers: ObservedIntersection[] = [];

class IntersectionObserverStub {
    private readonly observed: ObservedIntersection;

    constructor(callback: IntersectionObserverCallback) {
        this.observed = { callback, targets: [], isDisconnected: false };
        intersectionObservers.push(this.observed);
    }

    observe(target: Element) {
        this.observed.targets.push(target);
    }

    unobserve() {}

    disconnect() {
        this.observed.isDisconnected = true;
    }

    takeRecords() {
        return [];
    }
}

const getActiveIntersectionObservers = () => intersectionObservers.filter(({ isDisconnected }) => !isDisconnected);

const reportMessageActionsInView = (isIntersecting: boolean) =>
    act(() => {
        getActiveIntersectionObservers().forEach(({ callback, targets }) => {
            callback(
                targets.map((target) => ({ isIntersecting, target }) as IntersectionObserverEntry),
                {} as IntersectionObserver
            );
        });
    });

interface EmojiMartPickerProps {
    onEmojiSelect: (selection: { id: string; native?: string }) => void;
    autoFocus: boolean;
    custom?: { id: string }[];
    categories?: string[];
    emojiButtonSize?: number;
}

const emojiMartMocks = vi.hoisted(() => ({ latestPickerProps: null as EmojiMartPickerProps | null }));
vi.mock('emoji-mart', () => ({
    Picker: class {
        constructor(props: EmojiMartPickerProps) {
            emojiMartMocks.latestPickerProps = props;
        }
    },
}));

const createNotification = vi.fn();

const notificationsManager = {
    createNotification,
    removeNotification: vi.fn(),
    hideNotification: vi.fn(),
    clearNotifications: vi.fn(),
    setOffset: vi.fn(),
} as unknown as NotificationsManager;

const mockRetryMessage = vi.fn();
const mockDiscardMessage = vi.fn();

vi.mock('../../hooks/bridges/useChatMessage', () => ({
    useChatMessage: () => ({
        sendMessage: vi.fn(),
        retryMessage: mockRetryMessage,
        discardMessage: mockDiscardMessage,
    }),
}));

const timestamp = 1718534400;

const meetingName = 'Mock Meeting Name';

const mockEncryptedDisplayName = 'encrypted-john-doe';
const mockParticipantName = 'John Doe';

const mockChatMessage: MeetChatMessage = {
    type: 'message',
    timestamp,
    identity: '123',
    message: 'Hello, world!',
    id: 'test-message-id',
};

const mockParticipantEventRecord: ParticipantEventRecord = {
    type: 'event',
    timestamp,
    identity: '123',
    eventType: ParticipantEvent.Join,
};

const date = new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});

const createMockStore = () => {
    return configureStore({
        reducer: {
            ...sortedParticipantsReducer,
            ...participantsReducer,
            ...chatAndReactionsReducer,
        },
        preloadedState: {
            participants: {
                ...initialParticipantsState,
                participantsMap: {
                    '123': {
                        ParticipantUUID: '123',
                        EncryptedDisplayName: mockEncryptedDisplayName,
                    },
                },
                participantDecryptedNameMap: {
                    '123': mockParticipantName,
                },
            },
        },
    });
};

describe('ChatItem', () => {
    beforeEach(() => {
        flagMocks.enabledFlags = new Set(['MeetChatLumoEmojis', 'MeetCustomReactions']);
        vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        intersectionObservers = [];
        mockSendReaction.mockClear();
        createNotification.mockClear();
        emojiMartMocks.latestPickerProps = null;
    });

    const Wrapper = ({ children }: { children: React.ReactNode }) => {
        const store = createMockStore();

        return (
            <Provider context={ProtonStoreContext} store={store}>
                <NotificationsContext.Provider value={notificationsManager}>{children}</NotificationsContext.Provider>
            </Provider>
        );
    };

    it('should render a chat message', () => {
        render(
            <Wrapper>
                <ChatItem item={mockChatMessage} displayDate={true} />
            </Wrapper>
        );

        expect(screen.getByText(mockParticipantName)).toBeInTheDocument();
        expect(screen.getByText(mockChatMessage.message)).toBeInTheDocument();
        expect(screen.getByText(date)).toBeInTheDocument();
    });

    it('should render a participant event record', () => {
        render(
            <Wrapper>
                <ChatItem item={mockParticipantEventRecord} displayDate={false} meetingName={meetingName} />
            </Wrapper>
        );

        expect(screen.getByText(mockParticipantName)).toBeInTheDocument();
        expect(screen.getByText('Joined')).toBeInTheDocument();
        expect(screen.getByText(meetingName)).toBeInTheDocument();
        expect(screen.queryByText(date)).not.toBeInTheDocument();
    });

    it('should render the participant initials', () => {
        render(
            <Wrapper>
                <ChatItem item={mockChatMessage} displayDate={true} />
            </Wrapper>
        );

        expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should render a pending message with disabled text color and no error UI', () => {
        render(
            <Wrapper>
                <ChatItem item={{ ...mockChatMessage, status: 'pending' }} displayDate={true} />
            </Wrapper>
        );

        expect(screen.getByText(mockChatMessage.message)).toHaveClass('color-disabled');
        expect(screen.queryByText('Not sent, check your connection.')).not.toBeInTheDocument();
    });

    it('should render a sent message with the default text color', () => {
        render(
            <Wrapper>
                <ChatItem item={{ ...mockChatMessage, status: 'sent' }} displayDate={true} />
            </Wrapper>
        );

        expect(screen.getByText(mockChatMessage.message)).toHaveClass('color-weak');
    });

    it('should render retry/discard actions and an error message for a failed message', async () => {
        const user = userEvent.setup();

        render(
            <Wrapper>
                <ChatItem item={{ ...mockChatMessage, status: 'failed' }} displayDate={true} />
            </Wrapper>
        );

        expect(screen.getByText(mockChatMessage.message)).toHaveClass('color-disabled');
        expect(screen.getByText('Not sent, check your connection.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Retry' }));
        expect(mockRetryMessage).toHaveBeenCalledWith({ ...mockChatMessage, status: 'failed' });

        await user.click(screen.getByRole('button', { name: 'Discard' }));
        expect(mockDiscardMessage).toHaveBeenCalledWith(mockChatMessage.id);
    });

    describe('on a Vancouver device whose browser has the rules from before the move to permanent time', () => {
        beforeEach(() => {
            vi.stubEnv('TZ', 'America/Los_Angeles');
            const deviceOptions = Intl.DateTimeFormat().resolvedOptions();
            vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
                ...deviceOptions,
                timeZone: 'America/Vancouver',
            });
        });

        afterEach(() => {
            vi.unstubAllEnvs();
            vi.restoreAllMocks();
        });

        it('should render the message time in Vancouver time', () => {
            render(
                <Wrapper>
                    <ChatItem
                        item={{ ...mockChatMessage, timestamp: Date.parse('2026-11-12T17:00:00Z') }}
                        displayDate={true}
                    />
                </Wrapper>
            );

            expect(screen.getByText('10:00 AM')).toBeInTheDocument();
        });
    });

    describe('quick reactions', () => {
        const getPicker = () => screen.queryByRole('dialog', { name: 'Reaction picker' });

        const getRow = () => screen.getByRole('group', { name: `Message from ${mockParticipantName}` });

        const renderMessage = () =>
            render(
                <Wrapper>
                    <ChatItem item={mockChatMessage} />
                </Wrapper>
            );

        const openPicker = async () => {
            await userEvent.setup().click(screen.getByRole('button', { name: 'More reactions' }));
        };

        const chooseEmoji = async (native: string) => {
            await act(async () => {
                emojiMartMocks.latestPickerProps?.onEmojiSelect({ id: 'emoji', native });
            });
        };

        it('offers the four quick reactions followed by a more reactions button', () => {
            renderMessage();

            const toolbarButtons = screen.getAllByRole('button', { name: /^React with|^More reactions$/ });

            expect(toolbarButtons.map((button) => button.getAttribute('aria-label'))).toEqual([
                'React with 👍',
                'React with 💜',
                'React with 😂',
                'React with 😮',
                'More reactions',
            ]);
        });

        it('offers the previous quick reactions without a more reactions button when custom reactions are off', () => {
            flagMocks.enabledFlags.delete('MeetCustomReactions');
            renderMessage();

            const toolbarButtons = screen.getAllByRole('button', { name: /^React with|^More reactions$/ });

            expect(toolbarButtons.map((button) => button.getAttribute('aria-label'))).toEqual([
                'React with 👍',
                'React with ❤️',
                'React with 😂',
                'React with 😮',
                'React with 🥲',
                'React with 👎',
            ]);
            expect(getPicker()).not.toBeInTheDocument();
        });

        it('reacts with a quick reaction', async () => {
            renderMessage();

            await userEvent.setup().click(screen.getByRole('button', { name: 'React with 💜' }));

            expect(mockSendReaction).toHaveBeenCalledWith(mockChatMessage.id, '💜');
        });

        it('opens the picker without Lumo emojis and keeps the actions shown while it is open', async () => {
            renderMessage();

            const moreReactionsButton = screen.getByRole('button', { name: 'More reactions' });
            expect(moreReactionsButton).toHaveAttribute('aria-expanded', 'false');

            await openPicker();

            expect(getPicker()).toBeInTheDocument();
            expect(moreReactionsButton).toHaveAttribute('aria-expanded', 'true');
            expect(emojiMartMocks.latestPickerProps?.custom?.map(({ id }) => id)).toEqual(['lumo']);
            expect(emojiMartMocks.latestPickerProps?.categories).toContain('people');
            expect(emojiMartMocks.latestPickerProps?.categories).not.toContain('lumo');
            expect(screen.getByRole('group', { name: `Message from ${mockParticipantName}` })).toHaveClass(
                'chat-item--actions-visible'
            );
        });

        it('reacts with the picked emoji and closes the picker', async () => {
            renderMessage();

            await openPicker();
            await chooseEmoji('🚀');

            expect(mockSendReaction).toHaveBeenCalledWith(mockChatMessage.id, '🚀');
            expect(getPicker()).not.toBeInTheDocument();
            expect(getRow()).not.toHaveClass('chat-item--actions-visible');
        });

        it('moves focus to the more reactions button after an emoji is picked with the pointer', async () => {
            renderMessage();

            await openPicker();
            await chooseEmoji('🚀');

            expect(screen.getByRole('button', { name: 'More reactions' })).toHaveFocus();
            expect(getRow()).not.toHaveClass('chat-item--actions-visible');
        });

        it('moves focus to the more reactions button after an emoji is picked with the keyboard', async () => {
            const user = userEvent.setup();
            renderMessage();

            await user.tab();
            await user.tab();
            await user.keyboard('{End}{Enter}');
            await chooseEmoji('🚀');

            expect(screen.getByRole('button', { name: 'More reactions' })).toHaveFocus();
            expect(getRow()).not.toHaveClass('chat-item--actions-visible');
        });

        it('watches the message actions while the picker is open and stops once it closes', async () => {
            renderMessage();

            await openPicker();

            expect(getActiveIntersectionObservers().flatMap(({ targets }) => targets)).toEqual([
                screen.getByRole('group', { name: 'Message actions' }),
            ]);

            await userEvent.setup().keyboard('{Escape}');

            expect(getActiveIntersectionObservers()).toEqual([]);
        });

        it('keeps the picker open while the message actions stay in view', async () => {
            renderMessage();

            await openPicker();
            reportMessageActionsInView(true);

            expect(getPicker()).toBeInTheDocument();
        });

        it('closes the picker once the message actions scroll out of view', async () => {
            renderMessage();

            await openPicker();
            reportMessageActionsInView(false);

            expect(getPicker()).not.toBeInTheDocument();
        });

        it('focuses the more reactions button when the message scrolls out of view with focus in the picker', async () => {
            renderMessage();

            await openPicker();
            expect(getPicker()).toHaveFocus();

            reportMessageActionsInView(false);

            expect(getPicker()).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'More reactions' })).toHaveFocus();
        });

        it('leaves focus alone when the message scrolls out of view with focus outside the picker', async () => {
            renderMessage();

            await openPicker();
            (document.activeElement as HTMLElement).blur();

            reportMessageActionsInView(false);

            expect(getPicker()).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'More reactions' })).not.toHaveFocus();
        });

        it('scrolls the message actions into view before the picker opens', async () => {
            const isPickerOpenWhenScrolled: boolean[] = [];
            const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {
                isPickerOpenWhenScrolled.push(getPicker() !== null);
            });
            renderMessage();

            try {
                await openPicker();

                expect(getPicker()).toBeInTheDocument();
                expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
                expect(scrollIntoView.mock.contexts).toEqual([screen.getByRole('group', { name: 'Message actions' })]);
                expect(isPickerOpenWhenScrolled).toEqual([false]);
            } finally {
                scrollIntoView.mockRestore();
            }
        });

        it('sizes the emoji buttons so the picker fits a 320px viewport', async () => {
            const defaultInnerWidth = window.innerWidth;
            window.innerWidth = 320;

            try {
                renderMessage();
                await openPicker();

                expect(emojiMartMocks.latestPickerProps?.emojiButtonSize).toBe(34);
            } finally {
                window.innerWidth = defaultInnerWidth;
            }
        });

        it('keeps the emoji buttons at their full size on a wide viewport', async () => {
            renderMessage();
            await openPicker();

            expect(emojiMartMocks.latestPickerProps?.emojiButtonSize).toBe(40);
        });

        it.each([['more than one emoji', '😀😀']])('refuses %s', async (_, emoji) => {
            renderMessage();

            await openPicker();
            await chooseEmoji(emoji);

            expect(mockSendReaction).not.toHaveBeenCalled();
            expect(createNotification).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'error', text: 'This emoji can’t be used as a reaction' })
            );
            expect(getPicker()).toBeInTheDocument();
        });

        it.each(['❤️', '🇺🇸', '🧑‍🚀', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '👨‍👩‍👧‍👦'])('accepts %s', async (emoji) => {
            renderMessage();

            await openPicker();
            await chooseEmoji(emoji);

            expect(mockSendReaction).toHaveBeenCalledWith(mockChatMessage.id, emoji);
        });

        it('closes the picker on Escape and returns focus to the more reactions button', async () => {
            renderMessage();

            await openPicker();
            await userEvent.setup().keyboard('{Escape}');

            expect(getPicker()).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'More reactions' })).toHaveFocus();
        });

        it.each([{ isComposing: true }, { keyCode: 229 }])(
            'keeps the picker open on Escape that cancels an IME composition (%o)',
            async (composition) => {
                renderMessage();

                await openPicker();
                const focusedElement = document.activeElement as HTMLElement;
                const escapeEvent = createEvent.keyDown(focusedElement, { key: 'Escape', ...composition });

                fireEvent(focusedElement, escapeEvent);

                expect(getPicker()).toBeInTheDocument();
                expect(screen.getByRole('button', { name: 'More reactions' })).not.toHaveFocus();
            }
        );

        it('closes the picker on an outside click', async () => {
            const user = userEvent.setup();
            renderMessage();

            await openPicker();
            await user.click(document.body);

            expect(getPicker()).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'More reactions' })).not.toHaveFocus();
        });

        it('opens the picker from the keyboard', async () => {
            const user = userEvent.setup();
            renderMessage();

            await user.tab();
            expect(screen.getByRole('group', { name: `Message from ${mockParticipantName}` })).toHaveFocus();

            await user.tab();
            expect(screen.getByRole('button', { name: 'React with 👍' })).toHaveFocus();

            await user.keyboard('{End}');
            expect(screen.getByRole('button', { name: 'More reactions' })).toHaveFocus();

            await user.keyboard('{Enter}');
            expect(getPicker()).toBeInTheDocument();
            expect(emojiMartMocks.latestPickerProps?.autoFocus).toBe(true);
        });
    });
});
