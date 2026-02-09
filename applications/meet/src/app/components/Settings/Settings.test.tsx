import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { MeetSettingsState } from '@proton/meet/store/slices/settings';
import { settingsReducer } from '@proton/meet/store/slices/settings';
import { MeetingSideBars, uiStateReducer } from '@proton/meet/store/slices/uiStateSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';

import type { MeetContextValues } from '../../contexts/MeetContext';
import { MeetContext } from '../../contexts/MeetContext';
import { useIsLocalParticipantAdmin } from '../../hooks/useIsLocalParticipantAdmin';
import { Settings } from './Settings';

vi.mock('../../hooks/useLocalParticipantResolution', () => ({
    useLocalParticipantResolution: vi.fn().mockReturnValue({
        resolution: '1080p',
        handleResolutionChange: vi.fn(),
    }),
}));

vi.mock('../../hooks/useIsLocalParticipantAdmin', () => ({
    useIsLocalParticipantAdmin: vi.fn().mockReturnValue({
        isLocalParticipantAdmin: false,
        hasAnotherAdmin: false,
        hostIsPresent: false,
        isLocalParticipantHost: false,
    }),
}));

vi.mock('../../contexts/MediaManagementContext', () => ({
    useMediaManagementContext: vi.fn().mockReturnValue({
        backgroundBlur: false,
        toggleBackgroundBlur: vi.fn(),
        isBackgroundBlurSupported: false,
        noiseFilter: false,
        toggleNoiseFilter: vi.fn(),
    }),
}));

const createMockStore = (settingsState: Partial<MeetSettingsState> = {}) => {
    return configureStore({
        // @ts-expect-error - mock data
        reducer: {
            ...settingsReducer,
            ...uiStateReducer,
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
}: {
    children: React.ReactNode;
    contextValue?: Partial<MeetContextValues>;
    settingsState?: Partial<MeetSettingsState>;
}) => {
    const store = createMockStore(settingsState);

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
        // Temporarily override the mock for this test
        const mockUseIsLocalParticipantAdmin = vi.mocked(useIsLocalParticipantAdmin);
        mockUseIsLocalParticipantAdmin.mockReturnValueOnce({
            isLocalParticipantAdmin: true,
            hasAnotherAdmin: false,
            hostIsPresent: true,
            isLocalParticipantHost: false,
        });

        render(
            <Wrapper>
                <Settings />
            </Wrapper>
        );

        expect(screen.getByText('Security')).toBeInTheDocument();
        expect(screen.getByText('Lock meeting')).toBeInTheDocument();
    });
});
