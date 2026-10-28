import {
    selectComposer,
    selectComposersCount,
    selectHasFocusedComposer,
    selectOpenedComposersIds,
} from './composerSelectors';
import type { Composer, ComposersStoreState } from './composerTypes';

const makeComposer = (ID: string): Composer => ({
    ID,
    messageID: `message-${ID}`,
    status: 'loading',
    recipients: { ToList: [], CCList: [], BCCList: [] },
    changesCount: 0,
    isMinimized: false,
    isMaximized: false,
});

const state: ComposersStoreState = {
    composers: {
        composers: { a: makeComposer('a'), b: makeComposer('b') },
        hasFocusedComposer: true,
    },
};

describe('composerSelectors', () => {
    it('selects the opened composers', () => {
        expect(selectComposersCount(state)).toBe(2);
        expect(selectOpenedComposersIds(state)).toEqual(['a', 'b']);
    });

    it('selects a composer by ID', () => {
        expect(selectComposer(state, 'b')).toBe(state.composers.composers.b);
        expect(selectComposer(state, 'missing')).toBeUndefined();
    });

    it('selects whether a composer has focus', () => {
        expect(selectHasFocusedComposer(state)).toBe(true);
    });
});
