import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { initialState as initialMeetingInfoState, meetingInfoReducer } from '@proton/meet/store/slices';
import { recordingStatusReducer } from '@proton/meet/store/slices/recordingStatusSlice';
import { screenShareStatusReducer } from '@proton/meet/store/slices/screenShareStatusSlice';
import { ParticipantCapabilityPermission } from '@proton/meet/types/types';
import { ProtonStoreContext } from '@proton/react-redux-store';
import { useFlag } from '@proton/unleash/useFlag';

import { ParticipantListItemStatus } from './ParticipantListItemStatus';

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

const mockUseFlag = vi.mocked(useFlag);

const participantIdentity = 'participant-1';
const otherParticipantIdentity = 'participant-2';

interface MockStoreOptions {
    isHost?: boolean;
    isScreenSharing?: boolean;
    isRecording?: boolean;
}

const createMockStore = ({ isHost = false, isScreenSharing = false, isRecording = false }: MockStoreOptions = {}) => {
    return configureStore({
        reducer: {
            ...meetingInfoReducer,
            ...recordingStatusReducer,
            ...screenShareStatusReducer,
        },
        preloadedState: {
            meetingInfo: {
                ...initialMeetingInfoState,
                participantsMap: {
                    [participantIdentity]: {
                        ParticipantUUID: participantIdentity,
                        IsAdmin: isHost
                            ? ParticipantCapabilityPermission.Allowed
                            : ParticipantCapabilityPermission.NotAllowed,
                    },
                },
            },
            recordingStatus: {
                participantsRecording: isRecording ? [participantIdentity] : [],
                isRecording: false,
            },
            screenShareStatus: {
                participantScreenSharingIdentity: isScreenSharing ? participantIdentity : null,
            },
        },
    });
};

const renderWithStore = (options: MockStoreOptions = {}, identity: string = participantIdentity) => {
    const store = createMockStore(options);

    return render(
        <Provider context={ProtonStoreContext} store={store}>
            <ParticipantListItemStatus participantIdentity={identity} />
        </Provider>
    );
};

describe('ParticipantListItemStatus', () => {
    beforeEach(() => {
        mockUseFlag.mockReturnValue(true);
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders nothing when the participant has no status', () => {
        const { container } = renderWithStore();

        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when the participant identity is not in the store', () => {
        const { container } = renderWithStore(
            { isHost: true, isScreenSharing: true, isRecording: true },
            otherParticipantIdentity
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('renders "Host" when the participant is the host', () => {
        renderWithStore({ isHost: true });

        expect(screen.getByText('Host')).toBeInTheDocument();
    });

    it('renders "Presenting" when the participant is screen sharing', () => {
        renderWithStore({ isScreenSharing: true });

        expect(screen.getByText('Presenting')).toBeInTheDocument();
    });

    it('renders "Recording" when the participant is recording and the multiple recording flag is enabled', () => {
        renderWithStore({ isRecording: true });

        expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    it('does not render "Recording" when the multiple recording flag is disabled', () => {
        mockUseFlag.mockReturnValue(false);

        const { container } = renderWithStore({ isRecording: true });

        expect(container).toBeEmptyDOMElement();
    });

    it('renders host and presenting status together with a separator', () => {
        renderWithStore({ isHost: true, isScreenSharing: true });

        expect(screen.getByText('Host · Presenting')).toBeInTheDocument();
    });

    it('renders host and recording status together with a separator', () => {
        renderWithStore({ isHost: true, isRecording: true });

        expect(screen.getByText('Host · Recording')).toBeInTheDocument();
    });

    it('renders presenting and recording status together with a separator', () => {
        renderWithStore({ isScreenSharing: true, isRecording: true });

        expect(screen.getByText('Presenting · Recording')).toBeInTheDocument();
    });

    it('renders all three statuses together in the correct order', () => {
        renderWithStore({ isHost: true, isScreenSharing: true, isRecording: true });

        expect(screen.getByText('Host · Presenting · Recording')).toBeInTheDocument();
    });

    it('only includes host and presenting when the recording flag is disabled but the participant is recording', () => {
        mockUseFlag.mockReturnValue(false);

        renderWithStore({ isHost: true, isScreenSharing: true, isRecording: true });

        expect(screen.getByText('Host · Presenting')).toBeInTheDocument();
        expect(screen.queryByText(/Recording/)).not.toBeInTheDocument();
    });
});
