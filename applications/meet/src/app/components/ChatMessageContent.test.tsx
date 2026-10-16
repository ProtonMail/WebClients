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
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

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

    it('renders a Lumo emoji token as the bundled image named after the emoji', () => {
        renderContent('all good [lumo_emoji:this-is-fine]');

        expect(screen.getByRole('img', { name: 'This is fine' })).toHaveAttribute(
            'src',
            expect.stringContaining('/lumo-emojis/this-is-fine.gif')
        );
        expect(screen.queryByText(/lumo_emoji/)).not.toBeInTheDocument();
    });

    it('offers the still image of a Lumo emoji under the reduced-motion media query', () => {
        renderContent('[lumo_emoji:this-is-fine]');

        const image = screen.getByRole('img', { name: 'This is fine' });
        const stillImageSource = image.previousElementSibling;

        expect(image.parentElement?.tagName).toBe('PICTURE');
        expect(stillImageSource?.tagName).toBe('SOURCE');
        expect(stillImageSource).toHaveAttribute('media', '(prefers-reduced-motion: reduce)');
        expect(stillImageSource).toHaveAttribute('srcset', expect.stringContaining('/lumo-emojis/this-is-fine.png'));
        expect(image).toHaveAttribute('src', expect.stringContaining('/lumo-emojis/this-is-fine.gif'));
    });

    it('renders a mention and a Lumo emoji in one message', () => {
        renderContent(`[participant_uuid:${ALICE}] [lumo_emoji:cash]`);

        expect(screen.getByText('@Alice Nguyen')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Cash' })).toBeInTheDocument();
    });

    it('renders a Lumo emoji token with an unknown or forged id as text', () => {
        renderContent('[lumo_emoji:unicorn] [lumo_emoji:constructor]');

        expect(screen.getByText('[lumo_emoji:unicorn] [lumo_emoji:constructor]')).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('links only the URL when a Lumo emoji token is glued to it', () => {
        renderContent('https://proton.me/[lumo_emoji:rocket]');

        expect(screen.getByRole('link', { name: /proton\.me/ })).toHaveAttribute('href', 'https://proton.me/');
        expect(screen.getByRole('img', { name: 'Rocket' })).toBeInTheDocument();
    });
});
