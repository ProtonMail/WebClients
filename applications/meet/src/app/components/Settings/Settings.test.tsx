import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NotificationsProvider from '@proton/components/containers/notifications/Provider';
import { backgroundReducer } from '@proton/meet/store/slices/backgroundSlice';
import { connectionReducer, initialState as initialConnectionState } from '@proton/meet/store/slices/connectionSlice';
import {
    initialState as initialParticipantsState,
    participantsReducer,
} from '@proton/meet/store/slices/participants/participantsSlice';
import {
    initialState as initialSortedParticipantsState,
    sortedParticipantsReducer,
} from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import type { ScreenShareStatusState } from '@proton/meet/store/slices/screenShareStatusSlice';
import { screenShareStatusReducer } from '@proton/meet/store/slices/screenShareStatusSlice';
import type { MeetSettingsState } from '@proton/meet/store/slices/settings';
import { settingsReducer } from '@proton/meet/store/slices/settings';
import { MeetingSideBars, uiStateReducer } from '@proton/meet/store/slices/uiStateSlice';
import { meetUserReducer } from '@proton/meet/store/slices/userSlice';
import { ParticipantCapabilityPermission } from '@proton/meet/types/types';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { BackgroundEffectsContext } from '../../contexts/BackgroundEffects/BackgroundEffectsContext';
import type { MediaManagementContextType } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { MediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import type { MeetContextValues } from '../../contexts/MeetContext';
import { MeetContext } from '../../contexts/MeetContext';
import { WANTS_CAPTIONS_ATTR } from '../../hooks/captions/useCaptionsPreference';
import { Settings } from './Settings';

const localAttributes = vi.hoisted(() => ({ current: {} as Record<string, string> }));
const enabledFlags = vi.hoisted(() => ({ current: ['MeetLiveCaptions', 'MeetVirtualBackground'] as string[] }));

vi.mock('@livekit/components-react', () => ({
    useRoomContext: () => ({
        localParticipant: { attributes: localAttributes.current, setAttributes: vi.fn() },
        remoteParticipants: new Map(),
        on: vi.fn(),
        off: vi.fn(),
    }),
    useParticipantAttributes: () => ({ attributes: localAttributes.current }),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: (flag: string) => enabledFlags.current.includes(flag),
}));

const supportMocks = vi.hoisted(() => ({ supportsBackgroundEffects: vi.fn(() => true) }));
vi.mock('../../processors/background-processor/createBackgroundProcessor', () => supportMocks);

const hostParticipantsState = {
    localParticipantIdentity: 'local-participant',
    participantsMap: {
        'local-participant': {
            ParticipantUUID: 'local-participant',
            IsHost: ParticipantCapabilityPermission.Allowed,
        },
    },
};

const createMockStore = (
    settingsState: Partial<MeetSettingsState> = {},
    participantsState: Partial<typeof initialParticipantsState> = {},
    screenShareState: Partial<ScreenShareStatusState> = {}
) => {
    return configureStore({
        // @ts-expect-error - mock data
        reducer: {
            ...settingsReducer,
            ...uiStateReducer,
            ...participantsReducer,
            ...screenShareStatusReducer,
            ...sortedParticipantsReducer,
            ...connectionReducer,
            ...meetUserReducer,
            ...backgroundReducer,
        },
        preloadedState: {
            meetSettings: {
                disableVideos: false,
                participantsWithDisabledVideos: [],
                selfView: true,
                meetingLocked: false,
                pipEnabled: true,
                waitingRoomSetting: false,
                ...settingsState,
            },
            uiState: {
                meetingReadyPopupOpen: false,
                showDuration: true,
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
                ...screenShareState,
            },
            sortedParticipants: {
                ...initialSortedParticipantsState,
            },
            // Settings are only reachable from inside a meeting.
            connection: {
                ...initialConnectionState,
                joinedRoom: true,
            },
            meetUser: {
                isGuest: false,
            },
            background: {
                appliedBackgroundEffect: 'none',
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
    mediaContextValue = {},
    settingsState = {},
    participantsState = {},
    screenShareState = {},
}: {
    children: React.ReactNode;
    contextValue?: Partial<MeetContextValues>;
    mediaContextValue?: Partial<MediaManagementContextType>;
    settingsState?: Partial<MeetSettingsState>;
    participantsState?: Partial<typeof initialParticipantsState>;
    screenShareState?: Partial<ScreenShareStatusState>;
}) => {
    const store = createMockStore(settingsState, participantsState, screenShareState);

    return (
        <Provider context={ProtonStoreContext} store={store}>
            <NotificationsProvider>
                {/* @ts-expect-error - contextValue is a partial MeetContextValues */}
                <MeetContext.Provider value={{ ...mockContextValues, ...contextValue }}>
                    <MediaManagementContext.Provider value={mediaContextValue as MediaManagementContextType}>
                        <BackgroundEffectsContext.Provider
                            // @ts-expect-error - only the blur toggle is needed
                            value={{ toggleBackgroundBlur: vi.fn() }}
                        >
                            {children}
                        </BackgroundEffectsContext.Provider>
                    </MediaManagementContext.Provider>
                </MeetContext.Provider>
            </NotificationsProvider>
        </Provider>
    );
};

describe('Settings', () => {
    beforeEach(() => {
        localAttributes.current = {};
        enabledFlags.current = ['MeetLiveCaptions', 'MeetVirtualBackground'];
    });

    it('should have the correct title', () => {
        render(
            <Wrapper>
                <Settings />
            </Wrapper>
        );
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should group the settings into sections', () => {
        render(
            <Wrapper>
                <Settings />
            </Wrapper>
        );

        expect(screen.getByRole('region', { name: 'Video and audio' })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'Background' })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'Display' })).toBeInTheDocument();
    });

    it('should allow for toggling the incoming video', async () => {
        render(
            <Wrapper settingsState={{ disableVideos: false }}>
                <Settings />
            </Wrapper>
        );

        const user = userEvent.setup();

        const incomingVideoCheckbox = screen.getByRole('checkbox', { name: 'Incoming video' });
        expect(incomingVideoCheckbox).toBeChecked();

        await user.click(incomingVideoCheckbox);

        expect(incomingVideoCheckbox).not.toBeChecked();
    });

    it('should allow for toggling the self view', async () => {
        render(
            <Wrapper settingsState={{ selfView: true }}>
                <Settings />
            </Wrapper>
        );

        const user = userEvent.setup();

        const selfViewCheckbox = screen.getByRole('checkbox', { name: 'Self view' });
        expect(selfViewCheckbox).toBeChecked();

        await user.click(selfViewCheckbox);

        expect(selfViewCheckbox).not.toBeChecked();
    });

    describe('picture-in-picture', () => {
        it('should allow for toggling it', async () => {
            render(
                <Wrapper settingsState={{ pipEnabled: true }}>
                    <Settings />
                </Wrapper>
            );

            const user = userEvent.setup();

            const pipCheckbox = screen.getByRole('checkbox', { name: 'Picture-in-picture while sharing' });
            expect(pipCheckbox).toBeChecked();

            await user.click(pipCheckbox);

            expect(pipCheckbox).not.toBeChecked();
        });

        // Starting or stopping the local share re-creates the PiP session, so the setting is frozen while sharing.
        it('should be locked while the local participant is sharing their screen', () => {
            render(
                <Wrapper
                    participantsState={hostParticipantsState}
                    screenShareState={{ participantScreenSharingIdentity: 'local-participant' }}
                >
                    <Settings />
                </Wrapper>
            );

            expect(screen.getByRole('checkbox', { name: 'Picture-in-picture while sharing' })).toBeDisabled();
        });
    });

    it('should allow for toggling the meeting timer', async () => {
        render(
            <Wrapper>
                <Settings />
            </Wrapper>
        );

        const user = userEvent.setup();

        const meetingTimerCheckbox = screen.getByRole('checkbox', { name: 'Meeting timer' });
        expect(meetingTimerCheckbox).toBeChecked();

        await user.click(meetingTimerCheckbox);

        expect(meetingTimerCheckbox).not.toBeChecked();
    });

    describe('host settings', () => {
        it('should be shown when the user is a host or admin', () => {
            render(
                <Wrapper participantsState={hostParticipantsState}>
                    <Settings />
                </Wrapper>
            );

            expect(screen.getByRole('region', { name: 'Host settings' })).toBeInTheDocument();
            expect(screen.getByText('Lock meeting')).toBeInTheDocument();
        });

        it('should be hidden for regular participants', () => {
            render(
                <Wrapper>
                    <Settings />
                </Wrapper>
            );

            expect(screen.queryByRole('region', { name: 'Host settings' })).not.toBeInTheDocument();
            expect(screen.queryByText('Lock meeting')).not.toBeInTheDocument();
        });

        it('should point free hosts at a paid plan for the waiting room', () => {
            enabledFlags.current = [...enabledFlags.current, 'MeetWaitingRoom', 'MeetWaitingRoomJoin'];

            render(
                <Wrapper participantsState={hostParticipantsState}>
                    <Settings />
                </Wrapper>
            );

            expect(screen.getByText('Available with a paid plan')).toBeInTheDocument();
            expect(screen.getByRole('checkbox', { name: 'Enable waiting room' })).toBeDisabled();
        });
    });

    it('should show the live captions display option', () => {
        render(
            <Wrapper>
                <Settings />
            </Wrapper>
        );

        expect(screen.getByRole('checkbox', { name: 'Live captions' })).toBeInTheDocument();
    });

    it('should only offer the spoken language while live captions are on', () => {
        const { rerender } = render(
            <Wrapper>
                <Settings />
            </Wrapper>
        );

        expect(screen.queryByText('Spoken language')).not.toBeInTheDocument();

        localAttributes.current = { [WANTS_CAPTIONS_ATTR]: 'true' };
        rerender(
            <Wrapper>
                <Settings />
            </Wrapper>
        );

        expect(screen.getByText('Spoken language')).toBeInTheDocument();
    });

    // The captions bar takes its height from the panel, so the section can end up below the fold.
    it('scrolls the captions setting back into view once captions are turned on', () => {
        const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});

        const { rerender } = render(
            <Wrapper>
                <Settings />
            </Wrapper>
        );

        expect(scrollIntoView).not.toHaveBeenCalled();

        localAttributes.current = { [WANTS_CAPTIONS_ATTR]: 'true' };
        rerender(
            <Wrapper>
                <Settings />
            </Wrapper>
        );

        expect(scrollIntoView).toHaveBeenCalled();
        scrollIntoView.mockRestore();
    });

    it('leaves the panel at the top when it is opened with captions already on', () => {
        const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
        localAttributes.current = { [WANTS_CAPTIONS_ATTR]: 'true' };

        render(
            <Wrapper>
                <Settings />
            </Wrapper>
        );

        expect(scrollIntoView).not.toHaveBeenCalled();
        scrollIntoView.mockRestore();
    });

    describe('virtual backgrounds button', () => {
        afterEach(() => {
            supportMocks.supportsBackgroundEffects.mockReturnValue(true);
        });

        it('should be enabled when background effects are supported', () => {
            render(
                <Wrapper>
                    <Settings />
                </Wrapper>
            );

            expect(screen.getByRole('button', { name: 'Virtual backgrounds' })).toBeEnabled();
        });

        it('should stay visible but disabled when background effects are not supported', () => {
            supportMocks.supportsBackgroundEffects.mockReturnValue(false);

            render(
                <Wrapper>
                    <Settings />
                </Wrapper>
            );

            expect(screen.getByRole('button', { name: 'Virtual backgrounds' })).toBeDisabled();
        });

        it('should explain on hover why it is disabled', async () => {
            supportMocks.supportsBackgroundEffects.mockReturnValue(false);

            render(
                <Wrapper>
                    <Settings />
                </Wrapper>
            );

            const user = userEvent.setup();

            await user.hover(screen.getByRole('button', { name: 'Virtual backgrounds' }));

            expect(await screen.findByText('Background effects are not supported on your browser')).toBeInTheDocument();
        });
    });
});
