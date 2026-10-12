import { fireEvent, render, screen } from '@testing-library/react';

import {
    selectCanManageWaitingRoom,
    selectIsMeetingLoading,
    selectIsPersonalRoom,
    selectMeetingLink,
    selectMeetingName,
} from '@proton/meet/store/slices/currentMeeting';
import { selectWaitingRoomSetting } from '@proton/meet/store/slices/settings';
import { selectIsWaitingRoomAdmissionActive } from '@proton/meet/store/slices/waitingRoomSlice';

import { tryOpenInDesktopApp } from '../../utils/desktopAppDetector';
import { PreJoinDetails } from './PreJoinDetails';

const MEETING_LINK = 'https://meet.proton.me/join/id-meeting-abc#pwd-password-abc';

const mocks = vi.hoisted(() => ({
    isElectronApp: false,
    isDesktop: vi.fn(),
    isIpad: vi.fn(),
    isHost: false,
    waitingRoomEnabled: false,
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
        ]);
        return values.get(selector);
    },
}));

vi.mock('@proton/meet/telemetry/meetTelemetry', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    sendMeetActionsEvent: vi.fn(),
    sendMeetDashboardEvent: vi.fn(),
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

const OPEN_IN_DESKTOP_APP = 'Open this meeting in the desktop app';
const WAITING_ROOM_HINT = 'This meeting has a waiting room';

const renderPreJoinDetails = ({ instantMeeting = false } = {}) =>
    render(
        <PreJoinDetails
            meetingLinkName="meeting-abc"
            displayName="Alice"
            keepDisplayName={false}
            onDisplayNameChange={vi.fn()}
            onJoinMeeting={vi.fn()}
            instantMeeting={instantMeeting}
        />
    );

describe('PreJoinDetails', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.isElectronApp = false;
        mocks.isDesktop.mockReturnValue(true);
        mocks.isIpad.mockReturnValue(false);
        mocks.isHost = false;
        mocks.waitingRoomEnabled = false;
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

        it('places the link above the waiting room hint and the card below it', () => {
            mocks.waitingRoomEnabled = true;
            renderPreJoinDetails();

            const hint = screen.getByText(WAITING_ROOM_HINT);
            const link = screen.getByRole('button', { name: OPEN_IN_DESKTOP_APP });
            expect(link.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

            fireEvent.click(link);

            const card = screen.getByText("App didn't open?");
            expect(hint.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        });

        it('opens the meeting and replaces the link with the help card', () => {
            renderPreJoinDetails();

            fireEvent.click(screen.getByRole('button', { name: OPEN_IN_DESKTOP_APP }));

            expect(tryOpenInDesktopApp).toHaveBeenCalledWith(MEETING_LINK);
            expect(screen.queryByRole('button', { name: OPEN_IN_DESKTOP_APP })).not.toBeInTheDocument();
            expect(screen.getByText("App didn't open?")).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus();
            expect(screen.getByRole('button', { name: 'Join in browser' })).toBeEnabled();
        });

        it('retries the same meeting from the help card', () => {
            renderPreJoinDetails();

            fireEvent.click(screen.getByRole('button', { name: OPEN_IN_DESKTOP_APP }));
            fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

            expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(2);
            expect(tryOpenInDesktopApp).toHaveBeenNthCalledWith(2, MEETING_LINK);
        });
    });
});
