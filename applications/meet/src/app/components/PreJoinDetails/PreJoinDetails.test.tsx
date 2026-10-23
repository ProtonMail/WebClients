import { fireEvent, render, screen } from '@testing-library/react';

import {
    selectCanManageWaitingRoom,
    selectIsMeetingLoading,
    selectIsPersonalRoom,
    selectMeetingLink,
    selectMeetingName,
} from '@proton/meet/store/slices/currentMeeting';
import { selectWaitingRoomSetting } from '@proton/meet/store/slices/settings';
import { selectIsGuest, selectUserId } from '@proton/meet/store/slices/userSlice';
import { selectIsWaitingRoomAdmissionActive } from '@proton/meet/store/slices/waitingRoomSlice';

import { getDesktopAppPreference, saveDesktopAppPreference, tryOpenInDesktopApp } from '../../utils/desktopAppDetector';
import { PreJoinDetails } from './PreJoinDetails';

const MEETING_LINK = 'https://meet.proton.me/join/id-meeting-abc#pwd-password-abc';

const mocks = vi.hoisted(() => ({
    isElectronApp: false,
    isDesktop: vi.fn(),
    isIpad: vi.fn(),
    isHost: false,
    waitingRoomEnabled: false,
    isGuest: false,
    userId: 'user-1',
}));

vi.mock('@proton/shared/lib/helpers/desktop', () => ({
    get isElectronApp() {
        return mocks.isElectronApp;
    },
}));

vi.mock('@proton/shared/lib/helpers/browser', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    isDesktop: mocks.isDesktop,
    isIpad: mocks.isIpad,
}));

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: (selector: unknown) => {
        const values = new Map<unknown, unknown>([
            [selectIsMeetingLoading, false],
            [selectMeetingName, 'Weekly sync'],
            [selectIsPersonalRoom, false],
            [selectCanManageWaitingRoom, mocks.isHost],
            [selectMeetingLink, MEETING_LINK],
            [selectIsWaitingRoomAdmissionActive, false],
            [selectWaitingRoomSetting, mocks.waitingRoomEnabled],
            [selectIsGuest, mocks.isGuest],
            [selectUserId, mocks.userId],
        ]);
        return values.get(selector);
    },
}));

vi.mock('@proton/meet/telemetry/meetTelemetry', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    sendMeetActionsEvent: vi.fn(),
    sendMeetDashboardEvent: vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: () => true,
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));

vi.mock('./WaitingRoomDropdown', () => ({
    WaitingRoomDropdown: () => <div data-testid="waiting-room-dropdown" />,
}));

vi.mock('./WaitingRoomAdmission/WaitingRoomAdmission', () => ({
    WaitingRoomAdmission: () => null,
}));

vi.mock('../../utils/desktopAppDetector', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    tryOpenInDesktopApp: vi.fn(),
}));

const OPEN_IN_DESKTOP_APP = 'Join from Proton Meet app';
const WAITING_ROOM_HINT = 'This meeting has a waiting room';
const USER_STORAGE_KEY = 'openInDesktopApp.user.user-1';
const OTHER_USER_STORAGE_KEY = 'openInDesktopApp.user.user-2';
const GUEST_STORAGE_KEY = 'openInDesktopApp.guest';

const renderPreJoinDetails = ({ instantMeeting = false, onJoinMeeting = vi.fn() } = {}) =>
    render(
        <PreJoinDetails
            meetingLinkName="meeting-abc"
            displayName="Alice"
            keepDisplayName={false}
            onDisplayNameChange={vi.fn()}
            onJoinMeeting={onJoinMeeting}
            instantMeeting={instantMeeting}
        />
    );

describe('PreJoinDetails', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mocks.isElectronApp = false;
        mocks.isDesktop.mockReturnValue(true);
        mocks.isIpad.mockReturnValue(false);
        mocks.isHost = false;
        mocks.waitingRoomEnabled = false;
        mocks.isGuest = false;
        mocks.userId = 'user-1';
    });

    describe('primary action label', () => {
        it('starts an instant meeting', () => {
            renderPreJoinDetails({ instantMeeting: true });

            expect(screen.getByRole('button', { name: 'Start meeting' })).toBeInTheDocument();
        });

        it('lets the host start the meeting in the browser', () => {
            mocks.isHost = true;
            renderPreJoinDetails();

            expect(screen.getByRole('button', { name: 'Start meeting in browser' })).toBeInTheDocument();
        });

        it('lets a participant join in the browser', () => {
            renderPreJoinDetails();

            expect(screen.getByRole('button', { name: 'Join in browser' })).toBeInTheDocument();
        });

        it.each([
            { role: 'host', isHost: true },
            { role: 'participant', isHost: false },
        ])('keeps "Join meeting" for the $role inside the desktop app', ({ isHost }) => {
            mocks.isElectronApp = true;
            mocks.isHost = isHost;
            renderPreJoinDetails();

            expect(screen.getByRole('button', { name: 'Join meeting' })).toBeInTheDocument();
        });

        it('keeps "Start meeting" for an instant meeting inside the desktop app', () => {
            mocks.isElectronApp = true;
            renderPreJoinDetails({ instantMeeting: true });

            expect(screen.getByRole('button', { name: 'Start meeting' })).toBeInTheDocument();
        });
    });

    describe('open in desktop app', () => {
        it('shows the link on desktop', () => {
            renderPreJoinDetails();

            expect(screen.getByRole('button', { name: OPEN_IN_DESKTOP_APP })).toBeInTheDocument();
        });

        it('shows the link to the host of an existing meeting', () => {
            mocks.isHost = true;
            renderPreJoinDetails();

            expect(screen.getByRole('button', { name: OPEN_IN_DESKTOP_APP })).toBeInTheDocument();
        });

        it('hides the link for an instant meeting', () => {
            renderPreJoinDetails({ instantMeeting: true });

            expect(screen.queryByRole('button', { name: OPEN_IN_DESKTOP_APP })).not.toBeInTheDocument();
        });

        it('hides the link on mobile', () => {
            mocks.isDesktop.mockReturnValue(false);
            renderPreJoinDetails();

            expect(screen.queryByRole('button', { name: OPEN_IN_DESKTOP_APP })).not.toBeInTheDocument();
        });

        it('hides the link on iPad', () => {
            mocks.isIpad.mockReturnValue(true);
            renderPreJoinDetails();

            expect(screen.queryByRole('button', { name: OPEN_IN_DESKTOP_APP })).not.toBeInTheDocument();
        });

        it('hides the link inside the desktop app', () => {
            mocks.isElectronApp = true;
            renderPreJoinDetails();

            expect(screen.queryByRole('button', { name: OPEN_IN_DESKTOP_APP })).not.toBeInTheDocument();
        });

        it('places the button between the join button and the waiting room hint', () => {
            mocks.waitingRoomEnabled = true;
            renderPreJoinDetails();

            const joinButton = screen.getByRole('button', { name: 'Join in browser' });
            const appButton = screen.getByRole('button', { name: OPEN_IN_DESKTOP_APP });
            const hint = screen.getByText(WAITING_ROOM_HINT);
            expect(joinButton.compareDocumentPosition(appButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
            expect(appButton.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        });

        it('opens the meeting and keeps joining in the browser available', () => {
            renderPreJoinDetails();

            fireEvent.click(screen.getByRole('button', { name: OPEN_IN_DESKTOP_APP }));

            expect(tryOpenInDesktopApp).toHaveBeenCalledWith(MEETING_LINK);
            expect(screen.getByText("App didn't open?")).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Join in browser' })).toBeEnabled();
        });

        it('opens the app on load when the choice was remembered', () => {
            saveDesktopAppPreference(USER_STORAGE_KEY);
            renderPreJoinDetails();

            expect(tryOpenInDesktopApp).toHaveBeenCalledWith(MEETING_LINK);
            expect(screen.getByText("App didn't open?")).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Join in browser' })).toBeEnabled();
        });

        it('does not open the app on load for an instant meeting', () => {
            saveDesktopAppPreference(USER_STORAGE_KEY);
            renderPreJoinDetails({ instantMeeting: true });

            expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
        });

        it('forgets the desktop app choice when joining in the browser', () => {
            const onJoinMeeting = vi.fn();
            renderPreJoinDetails({ onJoinMeeting });

            fireEvent.click(screen.getByRole('button', { name: OPEN_IN_DESKTOP_APP }));
            expect(getDesktopAppPreference(USER_STORAGE_KEY)).toBe(true);

            fireEvent.click(screen.getByRole('button', { name: 'Join in browser' }));

            expect(getDesktopAppPreference(USER_STORAGE_KEY)).toBe(false);
            expect(onJoinMeeting).toHaveBeenCalledWith('Alice', false);
        });

        it('keeps the desktop app choice when starting an instant meeting', () => {
            saveDesktopAppPreference(USER_STORAGE_KEY);
            const onJoinMeeting = vi.fn();
            renderPreJoinDetails({ instantMeeting: true, onJoinMeeting });

            fireEvent.click(screen.getByRole('button', { name: 'Start meeting' }));

            expect(getDesktopAppPreference(USER_STORAGE_KEY)).toBe(true);
            expect(onJoinMeeting).toHaveBeenCalledWith('Alice', false);
        });

        it("ignores and keeps another account's choice on the same browser", () => {
            saveDesktopAppPreference(OTHER_USER_STORAGE_KEY);
            renderPreJoinDetails();

            expect(tryOpenInDesktopApp).not.toHaveBeenCalled();

            fireEvent.click(screen.getByRole('button', { name: 'Join in browser' }));

            expect(getDesktopAppPreference(OTHER_USER_STORAGE_KEY)).toBe(true);
        });

        it("keeps the guest's choice apart from the signed-in one", () => {
            mocks.isGuest = true;
            mocks.userId = '';
            renderPreJoinDetails();

            fireEvent.click(screen.getByRole('button', { name: OPEN_IN_DESKTOP_APP }));

            expect(getDesktopAppPreference(GUEST_STORAGE_KEY)).toBe(true);
            expect(getDesktopAppPreference(USER_STORAGE_KEY)).toBe(false);
        });
    });
});
