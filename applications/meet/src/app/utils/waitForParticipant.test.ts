import { configureStore } from '@reduxjs/toolkit';

import { mergeParticipantsMap, participantsReducer } from '@proton/meet/store/slices/participants/participantsSlice';
import type { MeetStore } from '@proton/meet/store/store';
import type { ParticipantEntity } from '@proton/meet/types/types';

import { waitForParticipant } from './waitForParticipant';

const IDENTITY = 'sender-participant';

const participant: ParticipantEntity = {
    ParticipantUUID: 'sender-uuid',
    EncryptedDisplayName: '',
};

const createStore = () => {
    const store = configureStore({ reducer: { ...participantsReducer } });
    const subscribe = store.subscribe;
    let activeSubscriptions = 0;

    vi.spyOn(store, 'subscribe').mockImplementation((listener) => {
        activeSubscriptions++;
        const unsubscribe = subscribe(listener);
        return () => {
            activeSubscriptions--;
            unsubscribe();
        };
    });

    return {
        store,
        meetStore: store as unknown as MeetStore,
        getActiveSubscriptions: () => activeSubscriptions,
    };
};

describe('waitForParticipant', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('resolves with a participant already in the store without subscribing', async () => {
        const { store, meetStore } = createStore();
        store.dispatch(mergeParticipantsMap({ [IDENTITY]: participant }));

        await expect(waitForParticipant(meetStore, IDENTITY)).resolves.toEqual(participant);
        expect(store.subscribe).not.toHaveBeenCalled();
    });

    it('resolves once the participant loads, ignoring other participants, and unsubscribes', async () => {
        const { store, meetStore, getActiveSubscriptions } = createStore();
        const onResolve = vi.fn();

        void waitForParticipant(meetStore, IDENTITY).then(onResolve);

        store.dispatch(mergeParticipantsMap({ 'other-participant': participant }));
        await vi.advanceTimersByTimeAsync(0);
        expect(onResolve).not.toHaveBeenCalled();

        store.dispatch(mergeParticipantsMap({ [IDENTITY]: participant }));
        await vi.advanceTimersByTimeAsync(0);

        expect(onResolve).toHaveBeenCalledWith(participant);
        expect(getActiveSubscriptions()).toBe(0);
    });

    it('resolves with undefined and unsubscribes when the participant never loads', async () => {
        const { meetStore, getActiveSubscriptions } = createStore();
        const onResolve = vi.fn();

        void waitForParticipant(meetStore, IDENTITY, 1_000).then(onResolve);

        await vi.advanceTimersByTimeAsync(999);
        expect(onResolve).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);

        expect(onResolve).toHaveBeenCalledWith(undefined);
        expect(getActiveSubscriptions()).toBe(0);
    });
});
