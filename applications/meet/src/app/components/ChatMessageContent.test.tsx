import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
    mergeParticipantDecryptedNameMap,
    participantsReducer,
    setLocalParticipantIdentity,
} from '@proton/meet/store/slices/participants/participantsSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { getParticipantDisplayColorsByIdentity } from '../utils/participantDisplayColors/getParticipantDisplayColorsByIdentity';
import { ChatMessageContent } from './ChatMessageContent';

const ALICE = 'aaaaaaaa-1111-2222-3333-444444444444';
const LOCAL = 'bbbbbbbb-1111-2222-3333-444444444444';
const DEPARTED = 'cccccccc-1111-2222-3333-444444444444';

const Wrapper = ({ children }: { children: ReactNode }) => {
    const store = configureStore({ reducer: { ...participantsReducer } });

    store.dispatch(setLocalParticipantIdentity(LOCAL));
    store.dispatch(mergeParticipantDecryptedNameMap({ [ALICE]: 'Alice Nguyen' }));

    return (
        <Provider context={ProtonStoreContext} store={store}>
            {children}
        </Provider>
    );
};

const renderContent = (message: string) =>
    render(
        <Wrapper>
            <ChatMessageContent message={message} />
        </Wrapper>
    );

describe('ChatMessageContent', () => {
    afterEach(cleanup);

    it('renders a mention token as the participant name', () => {
        renderContent(`[participant_uuid:${ALICE}] confirm the date?`);

        expect(screen.getByText('@Alice Nguyen')).toBeInTheDocument();
        expect(screen.queryByText(/participant_uuid/)).not.toBeInTheDocument();
    });

    it('colours the mention the same way the participant initials are coloured', () => {
        renderContent(`[participant_uuid:${ALICE}]`);

        expect(screen.getByText('@Alice Nguyen')).toHaveClass(
            getParticipantDisplayColorsByIdentity(ALICE).profileTextColor
        );
    });

    it('renders a mention of an unknown participant as unknown', () => {
        renderContent(`[participant_uuid:${DEPARTED}]`);

        expect(screen.getByText('@unknown')).toBeInTheDocument();
    });

    it('renders a room-wide mention', () => {
        renderContent('[participant_uuid:everyone] standup now');

        expect(screen.getByText('@everyone')).toBeInTheDocument();
    });

    it('renders several mentions in one message', () => {
        renderContent(`[participant_uuid:everyone] and [participant_uuid:${ALICE}]`);

        expect(screen.getByText('@everyone')).toBeInTheDocument();
        expect(screen.getByText('@Alice Nguyen')).toBeInTheDocument();
    });

    it('still linkifies URLs alongside a mention', () => {
        renderContent(`[participant_uuid:${ALICE}] see https://proton.me/`);

        expect(screen.getByText('@Alice Nguyen')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /proton\.me/ })).toHaveAttribute('href', 'https://proton.me/');
    });

    it('leaves plain text that merely resembles a token alone', () => {
        renderContent('[participant_uuid:not an id]');

        expect(screen.getByText('[participant_uuid:not an id]')).toBeInTheDocument();
    });
});
