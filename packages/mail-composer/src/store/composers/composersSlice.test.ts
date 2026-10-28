import type { Recipient } from '@proton/shared/lib/interfaces/Address';

import type { Composer, ComposersState } from './composerTypes';
import { composerActions, composersInitialState, composersReducer } from './composersSlice';

const reducer = composersReducer.composers;

const alice: Recipient = { Name: 'Alice', Address: 'alice@example.com' };
const bob: Recipient = { Name: 'Bob', Address: 'bob@example.com' };

const composer: Composer = {
    ID: 'composer-1',
    messageID: 'message-1',
    senderEmailAddress: 'me@example.com',
    recipients: { ToList: [], CCList: [], BCCList: [] },
    changesCount: 0,
    status: 'idle',
    isMinimized: false,
    isMaximized: false,
};

const withComposer = (): ComposersState => reducer(composersInitialState, composerActions.addComposer(composer));

describe('composersSlice', () => {
    it('adds and removes a composer', () => {
        const state = withComposer();
        expect(state.composers['composer-1']).toEqual(composer);

        const next = reducer(state, composerActions.removeComposer({ ID: 'composer-1' }));
        expect(next.composers).toEqual({});
    });

    it('initializes sender and recipients from the message', () => {
        const state = reducer(
            withComposer(),
            composerActions.setInitialized({
                ID: 'composer-1',
                message: { data: { Sender: alice, ToList: [bob], CCList: [alice], BCCList: [] } },
            })
        );

        expect(state.composers['composer-1'].senderEmailAddress).toBe('alice@example.com');
        expect(state.composers['composer-1'].recipients).toEqual({ ToList: [bob], CCList: [alice], BCCList: [] });
    });

    it('counts sender and recipient changes', () => {
        let state = reducer(
            withComposer(),
            composerActions.setSender({ ID: 'composer-1', emailAddress: 'other@example.com' })
        );
        state = reducer(state, composerActions.setRecipients({ ID: 'composer-1', type: 'CCList', recipients: [bob] }));

        expect(state.composers['composer-1'].senderEmailAddress).toBe('other@example.com');
        expect(state.composers['composer-1'].recipients.CCList).toEqual([bob]);
        expect(state.composers['composer-1'].changesCount).toBe(2);
    });

    it('un-minimizes a composer when it is maximized', () => {
        let state = reducer(withComposer(), composerActions.toggleMinimizeComposer('composer-1'));
        expect(state.composers['composer-1'].isMinimized).toBe(true);

        state = reducer(state, composerActions.toggleMaximizeComposer('composer-1'));
        expect(state.composers['composer-1']).toMatchObject({ isMinimized: false, isMaximized: true });
    });

    it('tracks whether a composer has focus', () => {
        const state = reducer(composersInitialState, composerActions.setHasFocusedComposer(true));
        expect(state.hasFocusedComposer).toBe(true);
    });
});
