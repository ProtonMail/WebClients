import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import type { LocalParticipant, RemoteParticipant } from 'livekit-client';
import { describe, expect, it } from 'vitest';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import type { MeetState } from '../rootReducer';
import { chatAndReactionsReducer, raiseHand } from './chatAndReactionsSlice';
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
    updateSortedParticipants,
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
            ...chatAndReactionsReducer,
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

    describe('updateSortedParticipants', () => {
        const createMockLocal = (overrides: Partial<LocalParticipant> = {}): LocalParticipant =>
            ({
                identity: 'local',
                isLocal: true,
                isSpeaking: false,
                audioLevel: 0,
                lastSpokeAt: undefined,
                isCameraEnabled: false,
                joinedAt: undefined,
                ...overrides,
            }) as unknown as LocalParticipant;

        const createMockRemote = (identity: string, overrides: Partial<RemoteParticipant> = {}): RemoteParticipant =>
            ({
                identity,
                isLocal: false,
                isSpeaking: false,
                audioLevel: 0,
                lastSpokeAt: undefined,
                isCameraEnabled: false,
                joinedAt: undefined,
                ...overrides,
            }) as unknown as RemoteParticipant;

        /** Single shared local participant mock (identity always `"local"`). */
        const local = createMockLocal();

        const runThunk = ({
            selfView = true,
            pageSize = 4,
            previousIdentities,
            participants,
            raisedHands = [],
        }: {
            selfView?: boolean;
            pageSize?: number;
            previousIdentities: readonly string[];
            participants: readonly (LocalParticipant | RemoteParticipant)[];
            raisedHands?: readonly string[];
        }) => {
            const store = createStore({ selfView });
            store.dispatch(setSortedParticipantIdentities([...previousIdentities]));
            store.dispatch(setPageSize(pageSize));
            raisedHands.forEach((identity) => {
                store.dispatch(raiseHand(identity));
            });
            store.dispatch(updateSortedParticipants([...participants]));
            return store.getState().sortedParticipants.sortedParticipantIdentities;
        };

        type UpdateSortedParticipantsCase = {
            description: string;
            selfView?: boolean;
            pageSize?: number;
            previousIdentities: readonly string[];
            participants: readonly (LocalParticipant | RemoteParticipant)[];
            /** Identities passed to `raiseHand` in order (store `raisedHands` before `updateSortedParticipants`). */
            raisedHands?: readonly string[];
            expectedIdentities: readonly string[];
        };
        const updateSortedParticipantsCases: UpdateSortedParticipantsCase[] = [
            {
                description: 'does not change the stored list when participants is empty',
                previousIdentities: ['local', 'A', 'B'],
                participants: [],
                expectedIdentities: ['local', 'A', 'B'],
            },
            {
                description: 'fills the stored list from participants when it was empty',
                selfView: false,
                pageSize: 4,
                previousIdentities: [],
                participants: [local, createMockRemote('A'), createMockRemote('B'), createMockRemote('C')],
                expectedIdentities: ['local', 'A', 'B', 'C'],
            },
            {
                description: 'keeps the stored order when everyone fits on one page even if a remote starts speaking',
                selfView: false,
                pageSize: 5,
                previousIdentities: ['local', 'A', 'B', 'C'],
                participants: [
                    local,
                    createMockRemote('A'),
                    createMockRemote('B', { isSpeaking: true, audioLevel: 0.5 }),
                    createMockRemote('C'),
                ],
                expectedIdentities: ['local', 'A', 'B', 'C'],
            },
            {
                description: 'does not reorder when the stored list already matches the participant list across pages',
                selfView: false,
                pageSize: 4,
                previousIdentities: ['local', 'A', 'B', 'C', 'D', 'E'],
                participants: [
                    local,
                    createMockRemote('A'),
                    createMockRemote('B'),
                    createMockRemote('C'),
                    createMockRemote('D'),
                    createMockRemote('E'),
                ],
                expectedIdentities: ['local', 'A', 'B', 'C', 'D', 'E'],
            },
            {
                description:
                    'keeps the stored per-page order when each page already has the right people but ranking would put them in a different order on that page',
                selfView: false,
                pageSize: 4,
                previousIdentities: ['local', 'A', 'B', 'C', 'D', 'E'],
                participants: [
                    local,
                    createMockRemote('A'),
                    createMockRemote('B'),
                    createMockRemote('C', { isSpeaking: true, audioLevel: 0.5 }),
                    createMockRemote('D'),
                    createMockRemote('E'),
                ],
                expectedIdentities: ['local', 'A', 'B', 'C', 'D', 'E'],
            },
            {
                description: 'removes identities that are no longer in the participant list',
                selfView: false,
                pageSize: 4,
                previousIdentities: ['local', 'A', 'B', 'C'],
                participants: [local, createMockRemote('A'), createMockRemote('C')],
                expectedIdentities: ['local', 'A', 'C'],
            },
            {
                description: 'appends identities for newly joined participants at the end of the stable list',
                selfView: false,
                pageSize: 4,
                previousIdentities: ['local', 'A', 'B'],
                participants: [local, createMockRemote('A'), createMockRemote('B'), createMockRemote('C')],
                expectedIdentities: ['local', 'A', 'B', 'C'],
            },
            {
                description: 'moves someone onto the page where they belong when they were listed on a later page',
                selfView: false,
                pageSize: 4,
                previousIdentities: ['local', 'A', 'B', 'C', 'D', 'E'],
                participants: [
                    local,
                    createMockRemote('A'),
                    createMockRemote('B'),
                    createMockRemote('C'),
                    createMockRemote('D'),
                    createMockRemote('E', { isSpeaking: true, audioLevel: 0.8 }),
                ],
                expectedIdentities: ['local', 'A', 'B', 'C', 'E', 'D'],
            },
            {
                description:
                    'does not reorder within a page when the same people stay on that page but ranking would order them differently',
                selfView: false,
                pageSize: 4,
                previousIdentities: ['local', 'A', 'B', 'C', 'D', 'E'],
                participants: [
                    local,
                    createMockRemote('A', { lastSpokeAt: new Date('2026-03-11T10:00:00') }),
                    createMockRemote('B', { lastSpokeAt: new Date('2026-03-11T12:00:00') }),
                    createMockRemote('C', { lastSpokeAt: new Date('2026-03-11T11:00:00') }),
                    createMockRemote('D', { isSpeaking: true, audioLevel: 0.5 }),
                    createMockRemote('E'),
                ],
                expectedIdentities: ['local', 'A', 'B', 'C', 'D', 'E'],
            },
            {
                description:
                    'swaps people between pages when the ideal assignment for each page does not match the stored pages',
                selfView: false,
                pageSize: 4,
                previousIdentities: ['local', 'A', 'B', 'C', 'D', 'E'],
                participants: [
                    local,
                    createMockRemote('A', { lastSpokeAt: new Date('2026-03-11T14:00:00') }),
                    createMockRemote('B', { lastSpokeAt: new Date('2026-03-11T11:00:00') }),
                    createMockRemote('C', { lastSpokeAt: new Date('2026-03-11T10:00:00') }),
                    createMockRemote('D', { lastSpokeAt: new Date('2026-03-11T12:00:00') }),
                    createMockRemote('E', { isSpeaking: true, audioLevel: 0.8 }),
                ],
                expectedIdentities: ['local', 'A', 'B', 'E', 'D', 'C'],
            },
            {
                description: 'can swap several pairs across pages in one update',
                selfView: false,
                pageSize: 4,
                previousIdentities: ['local', 'A', 'B', 'C', 'D', 'E', 'F'],
                participants: [
                    local,
                    createMockRemote('A', { lastSpokeAt: new Date('2026-03-11T13:00:00') }),
                    createMockRemote('B', { lastSpokeAt: new Date('2026-03-11T12:00:00') }),
                    createMockRemote('C', { lastSpokeAt: new Date('2026-03-11T11:00:00') }),
                    createMockRemote('D', { lastSpokeAt: new Date('2026-03-11T16:00:00') }),
                    createMockRemote('E', { lastSpokeAt: new Date('2026-03-11T15:00:00') }),
                    createMockRemote('F', { lastSpokeAt: new Date('2026-03-11T14:00:00') }),
                ],
                expectedIdentities: ['local', 'A', 'E', 'F', 'D', 'B', 'C'],
            },
            {
                description: 'leaves a single local identity unchanged when the stored list already matches',
                selfView: false,
                pageSize: 4,
                previousIdentities: ['local'],
                participants: [local],
                expectedIdentities: ['local'],
            },
            {
                description: 'with self view on, uses the same initial ordering when the stored list was empty',
                selfView: true,
                pageSize: 4,
                previousIdentities: [],
                participants: [local, createMockRemote('A'), createMockRemote('B'), createMockRemote('C')],
                expectedIdentities: ['local', 'A', 'B', 'C'],
            },
            {
                description:
                    'with self view on, keeps the stored order when pages already contain the correct people but in an order that would differ with self view off',
                selfView: true,
                pageSize: 3,
                previousIdentities: ['local', 'A', 'B', 'D', 'C'],
                participants: [
                    local,
                    createMockRemote('A', { lastSpokeAt: new Date('2026-03-11T15:00:00') }),
                    createMockRemote('B', { lastSpokeAt: new Date('2026-03-11T14:00:00') }),
                    createMockRemote('C', { lastSpokeAt: new Date('2026-03-11T13:00:00') }),
                    createMockRemote('D', { lastSpokeAt: new Date('2026-03-11T12:00:00') }),
                ],
                expectedIdentities: ['local', 'A', 'B', 'D', 'C'],
            },
            {
                description:
                    'with self view off, swaps across page boundaries for the same participant list that would not swap with self view on',
                selfView: false,
                pageSize: 3,
                previousIdentities: ['local', 'A', 'B', 'D', 'C'],
                participants: [
                    local,
                    createMockRemote('A', { lastSpokeAt: new Date('2026-03-11T15:00:00') }),
                    createMockRemote('B', { lastSpokeAt: new Date('2026-03-11T14:00:00') }),
                    createMockRemote('C', { lastSpokeAt: new Date('2026-03-11T13:00:00') }),
                    createMockRemote('D', { lastSpokeAt: new Date('2026-03-11T12:00:00') }),
                ],
                expectedIdentities: ['local', 'A', 'B', 'C', 'D'],
            },
            {
                description:
                    'with self view on, swaps a different remote than with self view off for the same stored order and participants',
                selfView: true,
                pageSize: 4,
                previousIdentities: ['local', 'A', 'B', 'C', 'D', 'E'],
                participants: [
                    local,
                    createMockRemote('A'),
                    createMockRemote('B'),
                    createMockRemote('C'),
                    createMockRemote('D'),
                    createMockRemote('E', { isSpeaking: true, audioLevel: 0.8 }),
                ],
                expectedIdentities: ['local', 'A', 'B', 'E', 'D', 'C'],
            },
            {
                description: 'places raised remotes immediately after local, before everyone else',
                selfView: true,
                pageSize: 4,
                previousIdentities: [],
                raisedHands: ['A'],
                participants: [local, createMockRemote('A'), createMockRemote('B'), createMockRemote('C')],
                expectedIdentities: ['local', 'A', 'B', 'C'],
            },
            {
                description: 'orders multiple raised remotes by the order they appear in raisedHands state',
                selfView: true,
                pageSize: 4,
                previousIdentities: [],
                raisedHands: ['B', 'A'],
                participants: [local, createMockRemote('A'), createMockRemote('B'), createMockRemote('C')],
                expectedIdentities: ['local', 'B', 'A', 'C'],
            },
            {
                description: 'does not treat the local identity as raised when it appears in raisedHands state',
                selfView: true,
                pageSize: 4,
                previousIdentities: [],
                raisedHands: ['local', 'A'],
                participants: [local, createMockRemote('A'), createMockRemote('B')],
                expectedIdentities: ['local', 'A', 'B'],
            },
            {
                description: 'ignores raisedHands entries that are not present in the participant list',
                selfView: true,
                pageSize: 4,
                previousIdentities: [],
                raisedHands: ['ghost', 'A'],
                participants: [local, createMockRemote('A'), createMockRemote('B')],
                expectedIdentities: ['local', 'A', 'B'],
            },
        ];

        it.each(updateSortedParticipantsCases)(
            '$description',
            ({ selfView, pageSize, previousIdentities, participants, raisedHands, expectedIdentities }) => {
                expect(
                    runThunk({
                        selfView,
                        pageSize,
                        previousIdentities,
                        participants,
                        raisedHands,
                    })
                ).toEqual(expectedIdentities);
            }
        );
    });
});
