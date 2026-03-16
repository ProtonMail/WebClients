import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import type { MeetState } from '../rootReducer';
import { setSelfView, settingsReducer } from './settings';
import {
    removeParticipant,
    resetSortedParticipants,
    selectPageCount,
    selectPagedIdentities,
    setPage,
    setPageSize,
    setSortedParticipantIdentities,
    sortedParticipantsReducer,
} from './sortedParticipantsSlice';

const reducer = sortedParticipantsReducer.sortedParticipants;

const createMockState = (
    overrides: {
        identities?: string[];
        page?: number;
        pageSize?: number;
        selfView?: boolean;
    } = {}
): MeetState =>
    ({
        sortedParticipants: {
            sortedParticipantIdentities: overrides.identities ?? [],
            page: overrides.page ?? 0,
            pageSize: overrides.pageSize ?? 4,
        },
        meetSettings: {
            selfView: overrides.selfView ?? true,
        },
    }) as unknown as MeetState;

const createStore = ({ selfView = true }: { selfView?: boolean } = {}) => {
    const store = configureStore({
        reducer: {
            ...sortedParticipantsReducer,
            ...settingsReducer,
        },
        preloadedState: {
            meetSettings: {
                disableVideos: false,
                participantsWithDisabledVideos: [],
                selfView,
                meetingLocked: false,
                pipEnabled: true,
            },
        },
    });
    return store as unknown as Omit<typeof store, 'dispatch' | 'getState'> & {
        dispatch: ThunkDispatch<MeetState, ProtonThunkArguments, UnknownAction>;
        getState: () => MeetState;
    };
};

describe('sortedParticipantsSlice', () => {
    describe('actions', () => {
        describe('setSortedParticipantIdentities', () => {
            it('should update identities when the list changes', () => {
                const state = reducer(undefined, setSortedParticipantIdentities(['A', 'B', 'C']));

                expect(state.sortedParticipantIdentities).toEqual(['A', 'B', 'C']);
            });

            it('should skip update when identities are identical', () => {
                const initial = reducer(undefined, setSortedParticipantIdentities(['A', 'B']));
                const next = reducer(initial, setSortedParticipantIdentities(['A', 'B']));

                expect(initial).toBe(next);
            });

            it('should update when identities have the same length but different values', () => {
                const initial = reducer(undefined, setSortedParticipantIdentities(['A', 'B']));
                const next = reducer(initial, setSortedParticipantIdentities(['A', 'C']));

                expect(next.sortedParticipantIdentities).toEqual(['A', 'C']);
            });

            it('should update when identities have different length', () => {
                const initial = reducer(undefined, setSortedParticipantIdentities(['A', 'B']));
                const next = reducer(initial, setSortedParticipantIdentities(['A', 'B', 'C']));

                expect(next.sortedParticipantIdentities).toEqual(['A', 'B', 'C']);
            });
        });

        describe('removeParticipant', () => {
            it('should remove the specified participant', () => {
                const store = createStore();
                store.dispatch(setSortedParticipantIdentities(['local', 'A', 'B', 'C']));

                store.dispatch(removeParticipant('B'));

                expect(store.getState().sortedParticipants.sortedParticipantIdentities).toEqual(['local', 'A', 'C']);
            });

            it('should not adjust page when removal does not affect current page validity', () => {
                const store = createStore();
                store.dispatch(setSortedParticipantIdentities(['local', 'A', 'B', 'C', 'D', 'E']));
                store.dispatch(setPageSize(4));
                store.dispatch(setPage(1));

                store.dispatch(removeParticipant('A'));

                const { page, sortedParticipantIdentities } = store.getState().sortedParticipants;
                expect(page).toBe(1);
                expect(sortedParticipantIdentities).toEqual(['local', 'B', 'C', 'D', 'E']);
            });

            it('should adjust page when removal does affect current page validity', () => {
                const store = createStore();
                store.dispatch(setSortedParticipantIdentities(['local', 'A', 'B', 'C', 'D']));
                store.dispatch(setPageSize(4));
                store.dispatch(setPage(1));

                store.dispatch(removeParticipant('A'));

                const { page, sortedParticipantIdentities } = store.getState().sortedParticipants;
                expect(page).toBe(0);
                expect(sortedParticipantIdentities).toEqual(['local', 'B', 'C', 'D']);
            });

            it('should adjust page when removal does affect current page validity when selfView is disabled', () => {
                const store = createStore({ selfView: false });
                store.dispatch(setSortedParticipantIdentities(['local', 'A', 'B', 'C', 'D', 'E']));
                store.dispatch(setPageSize(4));
                store.dispatch(setPage(1));

                store.dispatch(removeParticipant('A'));

                const { page, sortedParticipantIdentities } = store.getState().sortedParticipants;
                expect(page).toBe(0);
                expect(sortedParticipantIdentities).toEqual(['local', 'B', 'C', 'D', 'E']);
            });

            it('should not adjust page when removal does not affect current page validity when selfView is disabled', () => {
                const store = createStore({ selfView: false });
                store.dispatch(setSortedParticipantIdentities(['local', 'A', 'B', 'C', 'D', 'E', 'F']));
                store.dispatch(setPageSize(4));
                store.dispatch(setPage(1));

                store.dispatch(removeParticipant('A'));

                const { page, sortedParticipantIdentities } = store.getState().sortedParticipants;
                expect(page).toBe(1);
                expect(sortedParticipantIdentities).toEqual(['local', 'B', 'C', 'D', 'E', 'F']);
            });

            it('should not do anything when removing a non-existent participant', () => {
                const store = createStore();
                store.dispatch(setSortedParticipantIdentities(['local', 'A']));

                store.dispatch(removeParticipant('Z'));

                expect(store.getState().sortedParticipants.sortedParticipantIdentities).toEqual(['local', 'A']);
            });
        });

        describe('resetSortedParticipants', () => {
            it('should reset to initial state', () => {
                let state = reducer(undefined, setSortedParticipantIdentities(['A', 'B', 'C']));
                state = reducer(state, setPage(2));
                state = reducer(state, setPageSize(8));
                state = reducer(state, resetSortedParticipants());

                expect(state.sortedParticipantIdentities).toEqual([]);
                expect(state.page).toBe(0);
            });
        });
    });

    describe('selectors', () => {
        describe('selectPagedIdentities', () => {
            it('should return the current page slice', () => {
                const state = createMockState({
                    identities: ['local', 'A', 'B', 'C', 'D', 'E'],
                    page: 0,
                    pageSize: 4,
                    selfView: true,
                });

                expect(selectPagedIdentities(state)).toEqual(['local', 'A', 'B', 'C']);
            });

            it('should return the current page slice without self view', () => {
                const state = createMockState({
                    identities: ['local', 'A', 'B', 'C', 'D', 'E'],
                    page: 0,
                    pageSize: 4,
                    selfView: false,
                });

                expect(selectPagedIdentities(state)).toEqual(['A', 'B', 'C', 'D']);
            });

            it('should return the second page slice', () => {
                const state = createMockState({
                    identities: ['local', 'A', 'B', 'C', 'D', 'E'],
                    page: 1,
                    pageSize: 4,
                    selfView: true,
                });

                expect(selectPagedIdentities(state)).toEqual(['D', 'E']);
            });

            it('should return the second page slice without self view', () => {
                const state = createMockState({
                    identities: ['local', 'A', 'B', 'C', 'D', 'E'],
                    page: 1,
                    pageSize: 4,
                    selfView: false,
                });

                expect(selectPagedIdentities(state)).toEqual(['E']);
            });
        });

        describe('selectPageCount', () => {
            it('should not include local participant to calculate page count when selfView is disabled', () => {
                const state = createMockState({
                    identities: ['local', 'A', 'B', 'C', 'D'],
                    pageSize: 4,
                    selfView: false,
                });

                expect(selectPageCount(state)).toBe(1);
            });

            it('should include local participant to calculate page count when selfView is enabled', () => {
                const state = createMockState({
                    identities: ['local', 'A', 'B', 'C', 'D'],
                    pageSize: 4,
                    selfView: true,
                });

                expect(selectPageCount(state)).toBe(2);
            });

            it('should return 1 when there are no participants', () => {
                const state = createMockState({
                    identities: [],
                    selfView: false,
                });

                expect(selectPageCount(state)).toBe(1);
            });

            it('should return 1 when only local participant exists with selfView enabled', () => {
                const state = createMockState({
                    identities: ['local'],
                    selfView: true,
                });

                expect(selectPageCount(state)).toBe(1);
            });

            it('should return 1 when participants exactly fill one page without selfView', () => {
                const state = createMockState({
                    identities: ['local', 'A', 'B', 'C'],
                    pageSize: 4,
                    selfView: false,
                });

                expect(selectPageCount(state)).toBe(1);
            });

            it('should return 1 when participants exactly fill one page with selfView', () => {
                const state = createMockState({
                    identities: ['local', 'A', 'B', 'C', 'D'],
                    pageSize: 4,
                    selfView: false,
                });

                expect(selectPageCount(state)).toBe(1);
            });
        });
    });

    describe('selfView and pageSize changes after participants are sorted', () => {
        it('should reduce page count and return correct paged identities when selfView is toggled off', () => {
            const store = createStore({ selfView: true });
            store.dispatch(setSortedParticipantIdentities(['local', 'A', 'B', 'C', 'D']));
            store.dispatch(setPageSize(4));

            expect(selectPageCount(store.getState())).toBe(2);
            expect(selectPagedIdentities(store.getState())).toEqual(['local', 'A', 'B', 'C']);

            store.dispatch(setSelfView(false));

            expect(selectPageCount(store.getState())).toBe(1);
            expect(selectPagedIdentities(store.getState())).toEqual(['A', 'B', 'C', 'D']);
        });

        it('should provide correct page count for clamping when selfView is toggled off while on page > 0', () => {
            const store = createStore({ selfView: true });
            store.dispatch(setSortedParticipantIdentities(['local', 'A', 'B', 'C', 'D']));
            store.dispatch(setPageSize(4));
            store.dispatch(setPage(1));

            expect(selectPagedIdentities(store.getState())).toEqual(['D']);

            store.dispatch(setSelfView(false));

            // Page count drops from 2 to 1, so page 1 is now out of range
            const pageCount = selectPageCount(store.getState());
            expect(pageCount).toBe(1);

            // Simulate what usePaginationSizeUpdates does: clamp page
            store.dispatch(setPage(Math.max(0, pageCount - 1)));

            expect(selectPagedIdentities(store.getState())).toEqual(['A', 'B', 'C', 'D']);
        });

        it('should update page count when pageSize changes', () => {
            const store = createStore({ selfView: false });
            store.dispatch(setSortedParticipantIdentities(['local', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']));
            store.dispatch(setPageSize(4));

            expect(selectPageCount(store.getState())).toBe(2);

            store.dispatch(setPageSize(8));

            expect(selectPageCount(store.getState())).toBe(1);
        });

        it('should return correct paged identities after pageSize increases', () => {
            const store = createStore({ selfView: false });
            store.dispatch(setSortedParticipantIdentities(['local', 'A', 'B', 'C', 'D', 'E']));
            store.dispatch(setPageSize(2));

            expect(selectPagedIdentities(store.getState())).toEqual(['A', 'B']);

            store.dispatch(setPageSize(4));

            expect(selectPagedIdentities(store.getState())).toEqual(['A', 'B', 'C', 'D']);
        });

        it('should increase page count when selfView is toggled on', () => {
            const store = createStore({ selfView: false });
            store.dispatch(setSortedParticipantIdentities(['local', 'A', 'B', 'C', 'D']));
            store.dispatch(setPageSize(4));

            expect(selectPageCount(store.getState())).toBe(1);

            store.dispatch(setSelfView(true));

            expect(selectPageCount(store.getState())).toBe(2);
        });
    });
});
