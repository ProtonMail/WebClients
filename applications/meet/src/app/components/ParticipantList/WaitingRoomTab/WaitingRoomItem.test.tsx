import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { cleanup, render, screen } from '@testing-library/react';

import { meetingInfoModelReducer } from '@proton/meet/store/slices/meetingInfoModel';
import { participantsReducer } from '@proton/meet/store/slices/participants/participantsSlice';
import { sortedParticipantsReducer } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { WaitingRoomItem } from './WaitingRoomItem';

const createMockStore = () =>
    configureStore({
        reducer: {
            ...participantsReducer,
            ...sortedParticipantsReducer,
            ...meetingInfoModelReducer,
        },
    });

describe('WaitingRoomItem', () => {
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
            cleanup();
            vi.unstubAllEnvs();
            vi.restoreAllMocks();
        });

        it('should show since when the request waits in Vancouver time', () => {
            render(
                <Provider context={ProtonStoreContext} store={createMockStore()}>
                    <WaitingRoomItem
                        request={{
                            requestId: 'request-id',
                            participantUid: 'participant-uid',
                            receivedAt: Date.parse('2026-11-12T17:00:00Z'),
                            expiresAt: Date.parse('2026-11-12T17:05:00Z'),
                        }}
                    />
                </Provider>
            );

            expect(screen.getByText('Waiting since 10:00 AM')).toBeInTheDocument();
        });
    });
});
