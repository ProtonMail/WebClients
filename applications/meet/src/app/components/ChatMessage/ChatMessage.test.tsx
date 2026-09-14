import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LexicalEditor } from 'lexical';
import { $getRoot, $getSelection, $isRangeSelection, UNDO_COMMAND } from 'lexical';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NotificationsManager } from '@proton/app-context/notifications/manager';
import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext';
import { chatAndReactionsReducer } from '@proton/meet/store/slices/chatAndReactionsSlice';
import {
    mergeParticipantDecryptedNameMap,
    participantsReducer,
    setLocalParticipantIdentity,
} from '@proton/meet/store/slices/participants/participantsSlice';
import {
    setSortedParticipantIdentities,
    sortedParticipantsReducer,
} from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { getMentionToken } from '@proton/meet/utils/mentions/mentionToken';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { CHAT_MESSAGE_MAX_LENGTH } from '../../constants';
import { $readMentionValue } from '../../utils/mentions/mentionEditorState';
import { getParticipantDisplayColorsByIdentity } from '../../utils/participantDisplayColors/getParticipantDisplayColorsByIdentity';
import { $isMentionNode } from '../MentionInput/MentionNode';
import { ChatMessage } from './ChatMessage';

const unleashMocks = vi.hoisted(() => ({ useFlag: vi.fn(() => true) }));
vi.mock('@proton/unleash/useFlag', () => unleashMocks);

const LOCAL_IDENTITY = 'aaaaaaaa-1111-2222-3333-444444444444';
const ALICE_IDENTITY = 'bbbbbbbb-1111-2222-3333-444444444444';
const ROBERT_IDENTITY = 'cccccccc-1111-2222-3333-444444444444';

const ALICE_TOKEN = getMentionToken(ALICE_IDENTITY);
const ROBERT_TOKEN = getMentionToken(ROBERT_IDENTITY);

const createMockStore = () => {
    const store = configureStore({
        reducer: {
            ...chatAndReactionsReducer,
            ...participantsReducer,
            ...sortedParticipantsReducer,
        },
    });

    store.dispatch(setLocalParticipantIdentity(LOCAL_IDENTITY));
    store.dispatch(
        mergeParticipantDecryptedNameMap({
            [LOCAL_IDENTITY]: 'Marina Norbert',
            [ALICE_IDENTITY]: 'Alice Nguyen',
            [ROBERT_IDENTITY]: 'Robert Fox',
        })
    );
    store.dispatch(setSortedParticipantIdentities([LOCAL_IDENTITY, ALICE_IDENTITY, ROBERT_IDENTITY]));

    return store;
};

/** Six rows fit the popover; the rest of the budget is `react-window` overscan. */
const VIRTUALISED_ROW_BUDGET = 20;

const createLargeMeetingStore = (participantCount: number) => {
    const store = configureStore({
        reducer: {
            ...chatAndReactionsReducer,
            ...participantsReducer,
            ...sortedParticipantsReducer,
        },
    });

    const identities = [LOCAL_IDENTITY];
    const nameMap: Record<string, string> = { [LOCAL_IDENTITY]: 'Marina Norbert' };

    for (let index = 0; index < participantCount; index++) {
        const identity = `participant-${index}-uuid`;

        identities.push(identity);
        nameMap[identity] = `Participant ${index}`;
    }

    store.dispatch(setLocalParticipantIdentity(LOCAL_IDENTITY));
    store.dispatch(mergeParticipantDecryptedNameMap(nameMap));
    store.dispatch(setSortedParticipantIdentities(identities));

    return store;
};

type MockStore = ReturnType<typeof createMockStore>;

const createNotification = vi.fn();

const notificationsManager = {
    createNotification,
    removeNotification: vi.fn(),
    hideNotification: vi.fn(),
    clearNotifications: vi.fn(),
    setOffset: vi.fn(),
} as unknown as NotificationsManager;

const Wrapper = ({ children, store = createMockStore() }: { children: React.ReactNode; store?: MockStore }) => (
    <Provider context={ProtonStoreContext} store={store}>
        <NotificationsContext.Provider value={notificationsManager}>{children}</NotificationsContext.Provider>
    </Provider>
);

// Lexical editor: use `userEvent` for keys, but insert text via the editor API (no `beforeinput` in jsdom).
describe('ChatMessage', () => {
    afterEach(() => {
        cleanup();
        createNotification.mockClear();
        unleashMocks.useFlag.mockReturnValue(true);
    });

    const placeholderText = 'Type an encrypted message...';

    const getComposer = () => screen.getByRole('combobox', { name: 'Message' });

    const getEditor = () => (getComposer() as unknown as { __lexicalEditor: LexicalEditor }).__lexicalEditor;

    const getValue = () =>
        getEditor()
            .getEditorState()
            .read(() => $readMentionValue());

    const type = async (text: string) => {
        const editor = getEditor();

        await act(async () => {
            getComposer().focus();

            editor.update(() => {
                if (!$isRangeSelection($getSelection())) {
                    $getRoot().selectEnd();
                }

                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    selection.insertText(text);
                }
            });
        });
    };

    const clearComposer = async () => {
        const editor = getEditor();

        await act(async () => {
            editor.update(() => {
                $getRoot().clear();
            });
        });
    };

    const getSuggestionNames = () =>
        screen.queryAllByRole('option').map((option) => option.querySelector('bdi')?.textContent);

    const renderComposer = (onMessageSend = vi.fn(), store?: MockStore) => {
        render(
            <Wrapper store={store}>
                <ChatMessage onMessageSend={onMessageSend} />
            </Wrapper>
        );

        return onMessageSend;
    };

    it('renders with correct placeholder text', () => {
        renderComposer();

        expect(screen.getByText(placeholderText)).toBeInTheDocument();
    });

    it('hides the placeholder once the composer has content', async () => {
        renderComposer();

        await type('hello');

        expect(screen.queryByText(placeholderText)).not.toBeInTheDocument();
    });

    it('starts with empty message', () => {
        renderComposer();

        expect(getValue()).toBe('');
    });

    it('reflects typed text in its value', async () => {
        renderComposer();

        await type('Hello world');

        expect(getValue()).toBe('Hello world');
        expect(getComposer()).toHaveTextContent('Hello world');
    });

    it('calls onMessageSend with current message when send button is clicked', async () => {
        const onMessageSend = renderComposer(vi.fn().mockResolvedValue(true));
        const user = userEvent.setup();

        await type('Test message');
        await user.click(screen.getByRole('button', { name: 'Send an encrypted message' }));

        expect(onMessageSend).toHaveBeenCalledWith('Test message');
    });

    it('clears message after sending via button click', async () => {
        renderComposer(vi.fn().mockResolvedValue(true));
        const user = userEvent.setup();

        await type('Test message');
        await user.click(screen.getByRole('button', { name: 'Send an encrypted message' }));

        expect(getValue()).toBe('');
    });

    it('disables send button when message is empty or only whitespace', async () => {
        renderComposer();

        const sendButton = screen.getByRole('button', { name: 'Send an encrypted message' });

        expect(sendButton).toBeDisabled();

        await type('   ');
        expect(sendButton).toBeDisabled();

        await clearComposer();
        await type('Hello');
        expect(sendButton).toBeEnabled();
    });

    it('calls onMessageSend when Enter key is pressed without Shift', async () => {
        const onMessageSend = renderComposer(vi.fn().mockResolvedValue(true));
        const user = userEvent.setup();

        await type('Test message');
        await user.keyboard('{Enter}');

        expect(onMessageSend).toHaveBeenCalledWith('Test message');
        expect(getValue()).toBe('');
    });

    it('does not call onMessageSend when Shift+Enter is pressed', async () => {
        const onMessageSend = renderComposer();
        const user = userEvent.setup();

        await type('Test message');
        await user.keyboard('{Shift>}{Enter}{/Shift}');

        expect(onMessageSend).not.toHaveBeenCalled();
        expect(getValue().trim()).toBe('Test message');
    });

    it('handles multiline messages with Shift+Enter', async () => {
        const onMessageSend = renderComposer(vi.fn().mockResolvedValue(true));
        const user = userEvent.setup();

        await type('Line 1');
        await user.keyboard('{Shift>}{Enter}{/Shift}');
        await type('Line 2');

        expect(onMessageSend).not.toHaveBeenCalled();
        expect(getValue()).toBe('Line 1\nLine 2');

        await user.click(screen.getByRole('button', { name: 'Send an encrypted message' }));

        expect(onMessageSend).toHaveBeenCalledWith('Line 1\nLine 2');
    });

    it('maintains focus on the composer after sending message via Enter', async () => {
        renderComposer(vi.fn().mockResolvedValue(true));
        const user = userEvent.setup();

        await type('Test');
        await user.keyboard('{Enter}');

        expect(getComposer()).toHaveFocus();
    });

    it('clears the field before the send resolves so continued typing does not append to the sent text', async () => {
        let resolveSend: (value: boolean) => void = () => {};
        const onMessageSend = renderComposer(
            vi.fn(
                () =>
                    new Promise<boolean>((resolve) => {
                        resolveSend = resolve;
                    })
            )
        );
        const user = userEvent.setup();

        await type('First');
        await user.keyboard('{Enter}');

        expect(onMessageSend).toHaveBeenCalledWith('First');

        expect(getValue()).toBe('');

        await type('Second');
        expect(getValue()).toBe('Second');

        await act(async () => {
            resolveSend(true);
        });

        expect(getValue()).toBe('Second');
    });

    it('restores the unsent text when sending fails and nothing new was typed', async () => {
        const onMessageSend = renderComposer(vi.fn().mockResolvedValue(false));
        const user = userEvent.setup();

        await type('Test message');
        await user.keyboard('{Enter}');

        await act(async () => {});

        expect(onMessageSend).toHaveBeenCalledWith('Test message');
        expect(getValue()).toBe('Test message');
    });

    it('does not send empty or whitespace-only messages via Enter', async () => {
        const onMessageSend = renderComposer();
        const user = userEvent.setup();

        await user.keyboard('{Enter}');
        expect(onMessageSend).not.toHaveBeenCalled();

        await type('   ');
        await user.keyboard('{Enter}');
        expect(onMessageSend).not.toHaveBeenCalled();
    });

    it('limits messages to the maximum character count', async () => {
        renderComposer();

        await type('a'.repeat(CHAT_MESSAGE_MAX_LENGTH + 10));

        expect(getValue()).toBe('a'.repeat(CHAT_MESSAGE_MAX_LENGTH));
        expect(
            screen.getByText(`${CHAT_MESSAGE_MAX_LENGTH}/${CHAT_MESSAGE_MAX_LENGTH} characters`)
        ).toBeInTheDocument();
    });

    it('counts only the trimmed message against the limit', async () => {
        renderComposer();

        const content = 'a'.repeat(CHAT_MESSAGE_MAX_LENGTH);
        const padded = `  ${content}  `;

        await type(padded);

        expect(getValue()).toBe(padded);
        expect(
            screen.getByText(`${CHAT_MESSAGE_MAX_LENGTH}/${CHAT_MESSAGE_MAX_LENGTH} characters`)
        ).toBeInTheDocument();
    });

    it('hides the character counter until the message reaches 90% of the limit', async () => {
        renderComposer();

        const belowThreshold = 'a'.repeat(Math.floor(CHAT_MESSAGE_MAX_LENGTH * 0.9) - 1);
        const atThreshold = 'a'.repeat(Math.ceil(CHAT_MESSAGE_MAX_LENGTH * 0.9));

        await type(belowThreshold);

        expect(screen.queryByText(new RegExp(`\\d+/${CHAT_MESSAGE_MAX_LENGTH} characters`))).not.toBeInTheDocument();

        await clearComposer();
        await type(atThreshold);

        expect(screen.getByText(`${atThreshold.length}/${CHAT_MESSAGE_MAX_LENGTH} characters`)).toBeInTheDocument();
    });

    describe('mentions', () => {
        it('opens the suggestion list when @ is typed', async () => {
            renderComposer();

            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

            await type('@');

            expect(screen.getByRole('listbox')).toBeInTheDocument();
            expect(getSuggestionNames()).toEqual(['everyone', 'Alice Nguyen', 'Robert Fox']);
        });

        it('keeps the @ as plain text when the feature is turned off', async () => {
            unleashMocks.useFlag.mockReturnValue(false);
            renderComposer();

            await type('@ali');

            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
            expect(getValue()).toBe('@ali');
        });

        it('narrows the list down as more is typed', async () => {
            renderComposer();

            await type('@ali');

            expect(getSuggestionNames()).toEqual(['Alice Nguyen']);
        });

        it('mounts only a window of options for a large meeting', async () => {
            renderComposer(vi.fn(), createLargeMeetingStore(1000));

            await type('@');

            expect(screen.getByRole('listbox')).toBeInTheDocument();
            expect(screen.queryAllByRole('option').length).toBeLessThan(VIRTUALISED_ROW_BUDGET);
            expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-setsize', '1001');
        });

        it('keeps the highlighted option mounted when arrowing far down a large meeting', async () => {
            renderComposer(vi.fn(), createLargeMeetingStore(1000));
            const user = userEvent.setup();

            await type('@');

            for (let i = 0; i < 50; i++) {
                await user.keyboard('{ArrowDown}');
            }

            const activeOptionId = getComposer().getAttribute('aria-activedescendant');

            expect(activeOptionId).not.toBeNull();
            expect(document.getElementById(activeOptionId as string)).toHaveAttribute('aria-selected', 'true');
            expect(screen.queryAllByRole('option').length).toBeLessThan(VIRTUALISED_ROW_BUDGET);
        });

        it('hides the list when nothing matches', async () => {
            renderComposer();

            await type('@zzz');

            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });

        it('does not open when the @ continues a word', async () => {
            renderComposer();

            await type('alice@');

            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });

        it('ends the mention when a space directly follows the @', async () => {
            renderComposer();

            await type('@ ');

            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });

        it('keeps matching across the space in a full name', async () => {
            renderComposer();

            await type('@Alice Ng');

            expect(getSuggestionNames()).toEqual(['Alice Nguyen']);
        });

        it('inserts the highlighted participant on Enter and closes the list', async () => {
            renderComposer();
            const user = userEvent.setup();

            await type('hey @ali');
            await user.keyboard('{Enter}');

            expect(getValue()).toBe(`hey ${ALICE_TOKEN} `);
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });

        it('renders the accepted mention as a styled, atomic token', async () => {
            renderComposer();
            const user = userEvent.setup();

            await type('hey @ali');
            await user.keyboard('{Enter}');

            const pill = getComposer().querySelector(`[data-mention-id="${ALICE_IDENTITY}"]`);

            expect(pill).not.toBeNull();
            expect(pill).toHaveTextContent('@Alice Nguyen');
            expect(pill).toHaveClass('text-semibold');
            expect(pill).toHaveClass(getParticipantDisplayColorsByIdentity(ALICE_IDENTITY).profileTextColor);
        });

        it('sends the mention as a token rather than as the typed name', async () => {
            const onMessageSend = renderComposer(vi.fn().mockResolvedValue(true));
            const user = userEvent.setup();

            await type('hey @ali');
            await user.keyboard('{Enter}');
            await type('there');
            await user.keyboard('{Enter}');

            expect(onMessageSend).toHaveBeenCalledWith(`hey ${ALICE_TOKEN} there`);
        });

        it('does not send the message when Enter accepts a suggestion', async () => {
            const onMessageSend = renderComposer(vi.fn().mockResolvedValue(true));
            const user = userEvent.setup();

            await type('hey @ali');
            await user.keyboard('{Enter}');

            expect(onMessageSend).not.toHaveBeenCalled();

            await user.keyboard('{Enter}');

            expect(onMessageSend).toHaveBeenCalledWith(`hey ${ALICE_TOKEN} `);
        });

        it('moves the highlight with the arrow keys', async () => {
            renderComposer();
            const user = userEvent.setup();

            await type('@');
            await user.keyboard('{ArrowDown}{ArrowDown}');
            await user.keyboard('{Enter}');

            expect(getValue()).toBe(`${ROBERT_TOKEN} `);
        });

        it('inserts the room-wide mention', async () => {
            renderComposer();
            const user = userEvent.setup();

            await type('@every');
            await user.keyboard('{Enter}');

            expect(getValue()).toBe(`${getMentionToken('everyone')} `);
        });

        it('inserts the participant that is clicked', async () => {
            renderComposer();
            const user = userEvent.setup();

            await type('@');
            await user.click(screen.getByRole('option', { name: /Robert Fox/ }));

            expect(getValue()).toBe(`${ROBERT_TOKEN} `);
        });

        it('closes the list on Escape without clearing the typed text', async () => {
            renderComposer();
            const user = userEvent.setup();

            await type('@ali');
            await user.keyboard('{Escape}');

            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
            expect(getValue()).toBe('@ali');
        });

        it('reopens the list for a second mention in the same message', async () => {
            renderComposer();
            const user = userEvent.setup();

            await type('@ali');
            await user.keyboard('{Enter}');
            await type('@rob');
            await user.keyboard('{Enter}');

            expect(getValue()).toBe(`${ALICE_TOKEN} ${ROBERT_TOKEN} `);
        });

        it('marks a mention as an atomic token so it deletes in one step', async () => {
            renderComposer();
            const user = userEvent.setup();

            await type('hey @ali');
            await user.keyboard('{Enter}');

            const modes = getEditor()
                .getEditorState()
                .read(() =>
                    $getRoot()
                        .getAllTextNodes()
                        .filter($isMentionNode)
                        .map((node) => node.getMode())
                );

            // happy-dom lacks `Selection.modify`, so backspace behaviour is not exercised here.
            expect(modes).toEqual(['token']);
        });

        it('does not make a late-arriving label its own undo step', async () => {
            const store = createMockStore();
            renderComposer(vi.fn(), store);
            const user = userEvent.setup();

            await type('@ali');
            await user.keyboard('{Enter}');

            await act(async () => {
                store.dispatch(mergeParticipantDecryptedNameMap({ [ALICE_IDENTITY]: 'Alice Fox' }));
            });

            expect(getComposer().querySelector(`[data-mention-id="${ALICE_IDENTITY}"]`)).toHaveTextContent(
                '@Alice Fox'
            );

            await act(async () => {
                getEditor().dispatchCommand(UNDO_COMMAND, undefined);
            });

            expect(getValue()).toBe('@ali');
        });

        it('exposes exactly one listbox to assistive technology', async () => {
            renderComposer();

            await type('@');

            expect(screen.getAllByRole('listbox')).toHaveLength(1);
        });

        it('counts a mention as the token it is sent as, which is the string the limit applies to', async () => {
            renderComposer();
            const user = userEvent.setup();

            const filler = 'a'.repeat(Math.ceil(CHAT_MESSAGE_MAX_LENGTH * 0.9));

            await type(`${filler} @ali`);
            await user.keyboard('{Enter}');

            expect(
                screen.getByText(`${`${filler} ${ALICE_TOKEN}`.length}/${CHAT_MESSAGE_MAX_LENGTH} characters`)
            ).toBeInTheDocument();
        });

        it('refuses a mention that would not fit and says why', async () => {
            renderComposer();
            const user = userEvent.setup();

            const filler = 'a'.repeat(CHAT_MESSAGE_MAX_LENGTH - ' @ali'.length);

            await type(`${filler} @ali`);
            await user.keyboard('{Enter}');

            expect(getValue()).toBe(`${filler} @ali`);
            expect(createNotification).toHaveBeenCalledWith(
                expect.objectContaining({ key: 'chat-mention-too-long', type: 'error' })
            );
        });

        it('gives up text before a mention when the message has to be trimmed', async () => {
            renderComposer();
            const user = userEvent.setup();

            await type('@ali');
            await user.keyboard('{Enter}');
            await type('a'.repeat(CHAT_MESSAGE_MAX_LENGTH));

            expect(getValue().startsWith(`${ALICE_TOKEN} `)).toBe(true);
            expect(getValue()).toHaveLength(CHAT_MESSAGE_MAX_LENGTH);
        });
    });
});
