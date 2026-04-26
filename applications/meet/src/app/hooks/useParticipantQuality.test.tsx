import { Provider } from 'react-redux';

import { useParticipants } from '@livekit/components-react';
import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import { VideoQuality } from 'livekit-client';
import type { Mock } from 'vitest';

import { initialState as initialMeetingInfoState, meetingInfoReducer } from '@proton/meet/store/slices';
import {
    initialState as initialScreenShareStatusState,
    screenShareStatusReducer,
} from '@proton/meet/store/slices/screenShareStatusSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { useParticipantQuality } from './useParticipantQuality';

vi.mock('@livekit/components-react', () => ({
    useParticipants: vi.fn(),
}));

const createMockStore = ({ isScreenShare = false }: { isScreenShare?: boolean }) => {
    return configureStore({
        reducer: {
            ...meetingInfoReducer,
            ...screenShareStatusReducer,
        },
        preloadedState: {
            meetingInfo: { ...initialMeetingInfoState },
            screenShareStatus: {
                ...initialScreenShareStatusState,
                participantScreenSharingIdentity: isScreenShare ? 'test-participant' : null,
            },
        },
    });
};

const createWrapper = ({ isScreenShare = false }: { isScreenShare?: boolean } = {}) => {
    const store = createMockStore({ isScreenShare });

    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <Provider context={ProtonStoreContext} store={store}>
                {children}
            </Provider>
        );
    };
};

describe('useParticipantQuality', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should return LOW quality while screen share is active', () => {
        (useParticipants as Mock).mockReturnValue([]);
        const { result } = renderHook(() => useParticipantQuality(), {
            wrapper: createWrapper({ isScreenShare: true }),
            initialProps: { isScreenShare: true },
        });

        expect(result.current).toBe(VideoQuality.LOW);
    });

    it('should return LOW quality if there are more than 8 participants', () => {
        (useParticipants as Mock).mockReturnValue(Array(9).fill({}));
        const { result } = renderHook(() => useParticipantQuality(), { wrapper: createWrapper() });

        expect(result.current).toBe(VideoQuality.LOW);
    });

    it('should return HIGH quality if there are 3 or less participants', () => {
        (useParticipants as Mock).mockReturnValue(Array(3).fill({}));
        const { result } = renderHook(() => useParticipantQuality(), { wrapper: createWrapper() });

        expect(result.current).toBe(VideoQuality.HIGH);
    });

    it('should return MEDIUM quality if there are more than 3 and less than 9 participants and screen share is not active', () => {
        (useParticipants as Mock).mockReturnValue(Array(4).fill({}));
        const { result } = renderHook(() => useParticipantQuality(), { wrapper: createWrapper() });

        expect(result.current).toBe(VideoQuality.MEDIUM);
    });

    it('should return LOW quality if there are 3 participants and screen share is active', () => {
        (useParticipants as Mock).mockReturnValue(Array(3).fill({}));
        const { result } = renderHook(() => useParticipantQuality(), {
            wrapper: createWrapper({ isScreenShare: true }),
        });

        expect(result.current).toBe(VideoQuality.LOW);
    });
});
