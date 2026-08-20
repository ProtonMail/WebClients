import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
    initialState as initialParticipantsState,
    participantsReducer,
} from '@proton/meet/store/slices/participants/participantsSlice';
import {
    initialState as initialSortedParticipantsState,
    sortedParticipantsReducer,
} from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { screenShareStatusReducer } from '@proton/meet/store/slices/screenShareStatusSlice';
import type { MeetSettingsState } from '@proton/meet/store/slices/settings';
import { settingsReducer } from '@proton/meet/store/slices/settings';
import { MeetingSideBars, uiStateReducer } from '@proton/meet/store/slices/uiStateSlice';
import { ParticipantCapabilityPermission } from '@proton/meet/types/types';
import { ProtonStoreContext } from '@proton/react-redux-store';

import type { MeetContextValues } from '../../contexts/MeetContext';
import { MeetContext } from '../../contexts/MeetContext';
import { Settings } from './Settings';

const createMockStore = (
    settingsState: Partial<MeetSettingsState> = {},
    participantsState: Partial<typeof initialParticipantsState> = {}
) => {
    return configureStore({
        // @ts-expect-error - mock data
        reducer: {
            ...settingsReducer,
            ...uiStateReducer,
            ...participantsReducer,
            ...screenShareStatusReducer,
            ...sortedParticipantsReducer,
        },
        preloadedState: {
            meetSettings: {
                disableVideos: false,
                participantsWithDisabledVideos: [],
                selfView: true,
                meetingLocked: false,
                pipEnabled: true,
                ...settingsState,
            },
            uiState: {
                meetingReadyPopupOpen: false,
                sideBarState: {
                    [MeetingSideBars.Participants]: false,
                    [MeetingSideBars.AssignHost]: false,
                    [MeetingSideBars.Settings]: true,
                    [MeetingSideBars.Chat]: false,
                    [MeetingSideBars.MeetingDetails]: false,
                    [MeetingSideBars.Backgrounds]: false,
                },
                popupState: {
                    Microphone: false,
                    Camera: false,
                    LeaveMeeting: false,
                    LeaveMeetingParticipant: false,
                    ScreenShareLeaveWarning: false,
                    EndMeeting: false,
                },
                permissionPromptStatus: 'CLOSED',
                noDeviceDetected: 'CLOSED',
            },
            participants: {
                ...initialParticipantsState,
                ...participantsState,
            },
            screenShareStatus: {
                participantScreenSharingIdentity: null,
            },
            sortedParticipants: {
                ...initialSortedParticipantsState,
            },
        },
    });
};

const mockContextValues = {
    handleMeetingLockToggle: vi.fn(),
};

const Wrapper = ({
    children,
    contextValue = {},
    settingsState = {},
    participantsState = {},
}: {
    children: React.ReactNode;
    contextValue?: Partial<MeetContextValues>;
    settingsState?: Partial<MeetSettingsState>;
    participantsState?: Partial<typeof initialParticipantsState>;
}) => {
    const store = createMockStore(settingsState, participantsState);

    return (
        <Provider context={ProtonStoreContext} store={store}>
            {/* @ts-expect-error - contextValue is a partial MeetContextValues */}
            <MeetContext.Provider value={{ ...mockContextValues, ...contextValue }}>{children}</MeetContext.Provider>
        </Provider>
    );
};

describe('Settings', () => {
    it('should have the correct title', () => {
        render(
            <Wrapper>
                <Settings />
            </Wrapper>
        );
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should have the correct options', () => {
        render(
            <Wrapper>
                <Settings />
            </Wrapper>
        );

        expect(screen.getByText('Turn off incoming video')).toBeInTheDocument();
    });

    it('should allow for toggling the disable videos', async () => {
        render(
            <Wrapper settingsState={{ disableVideos: false }}>
                <Settings />
            </Wrapper>
        );

        const user = userEvent.setup();

        const turnOffIncomingVideoCheckbox = screen.getByRole('checkbox', { name: 'Turn off incoming video' });
        expect(turnOffIncomingVideoCheckbox).not.toBeChecked();

        await user.click(turnOffIncomingVideoCheckbox);

        expect(turnOffIncomingVideoCheckbox).toBeChecked();
    });

    it('should show security options when user is a host or admin', () => {
        render(
            <Wrapper
                participantsState={{
                    localParticipantIdentity: 'local-participant',
                    participantsMap: {
                        'local-participant': {
                            ParticipantUUID: 'local-participant',
                            IsHost: ParticipantCapabilityPermission.Allowed,
                        },
                    },
                }}
            >
                <Settings />
            </Wrapper>
        );

        expect(screen.getByText('Security')).toBeInTheDocument();
        expect(screen.getByText('Lock meeting')).toBeInTheDocument();
    });
});
