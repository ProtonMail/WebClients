import { act, fireEvent, render, screen } from '@testing-library/react';

import {
    selectCanManageWaitingRoom,
    selectIsMeetingLoading,
    selectIsPersonalRoom,
    selectMeetingLink,
    selectMeetingName,
} from '@proton/meet/store/slices/currentMeeting';
import {
    selectCameraPermission,
    selectMicrophonePermission,
    selectPermissionsModals,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { PermissionsModalType } from '@proton/meet/store/slices/deviceManagementSlice/types';
import { selectWaitingRoomSetting } from '@proton/meet/store/slices/settings';
import { selectIsGuest, selectUserId } from '@proton/meet/store/slices/userSlice';
import { selectIsWaitingRoomAdmissionActive } from '@proton/meet/store/slices/waitingRoomSlice';
import type { FeatureFlag } from '@proton/unleash/Flags';

import {
    getBrowserPreference,
    getDesktopAppPreference,
    saveBrowserPreference,
    saveDesktopAppPreference,
    tryOpenInDesktopApp,
} from '../../utils/desktopAppDetector';
import { openDesktopAppOnLoad } from '../../utils/openDesktopAppOnLoad';
import { PreJoinDetails } from './PreJoinDetails';

const MEETING_ID = 'meetingabc';
const MEETING_PATH = `/join/id-${MEETING_ID}#pwd-passwordabcd`;
const INSTANT_MEETING_PATH = '/join';
const DASHBOARD_PATH = '/dashboard';
const MEETING_LINK = `${window.location.origin}${MEETING_PATH}`;

const mocks = vi.hoisted(() => ({
    isElectronApp: false,
    isDesktop: vi.fn(),
    isIpad: vi.fn(),
    isSafari: vi.fn(),
    isFirefox: vi.fn(),
    flags: {} as Partial<Record<FeatureFlag, boolean>>,
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
    isSafari: mocks.isSafari,
    isFirefox: mocks.isFirefox,
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
            [selectPermissionsModals, { permissionsModal: PermissionsModalType.NONE }],
            [selectCameraPermission, 'granted'],
            [selectMicrophonePermission, 'granted'],
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
    useFlag: (flag: FeatureFlag) => mocks.flags[flag] ?? false,
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

const loadPage = (path: string) => {
    window.history.replaceState(null, '', path);
    openDesktopAppOnLoad({
        unleashClient: { isEnabled: (flag: FeatureFlag) => mocks.flags[flag] ?? false },
        userId: mocks.isGuest ? undefined : mocks.userId,
    });
};

const renderPreJoinDetails = ({
    instantMeeting = false,
    onJoinMeeting = vi.fn(),
    displayName = 'Alice',
    loadedOn = instantMeeting ? INSTANT_MEETING_PATH : MEETING_PATH,
}: {
    instantMeeting?: boolean;
    onJoinMeeting?: (displayName: string, keepOnDevice: boolean) => void;
    displayName?: string;
    loadedOn?: string;
} = {}) => {
    loadPage(loadedOn);
    const getPreJoinDetails = () => (
        <PreJoinDetails
            meetingLinkName={instantMeeting ? '' : MEETING_ID}
            displayName={displayName}
            keepDisplayName={false}
            onDisplayNameChange={vi.fn()}
            onJoinMeeting={onJoinMeeting}
            instantMeeting={instantMeeting}
        />
    );
    const { rerender } = render(getPreJoinDetails());

    return { rerenderPage: () => rerender(getPreJoinDetails()) };
};

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.isElectronApp = false;
    mocks.isDesktop.mockReturnValue(true);
    mocks.isIpad.mockReturnValue(false);
    mocks.isSafari.mockReturnValue(false);
    mocks.isFirefox.mockReturnValue(false);
    mocks.flags = { MeetOpenDesktopAppOnLoad: false, MeetOpenLinksInDesktopApp: true };
    mocks.isHost = false;
    mocks.waitingRoomEnabled = false;
    mocks.isGuest = false;
    mocks.userId = 'user-1';
});

describe.each([
    {
        page: 'Safari with MeetOpenDesktopAppOnLoad on',
        isSafari: true,
        isFirefox: false,
        isOpenDesktopAppOnLoadEnabled: true,
    },
    {
        page: 'Firefox with MeetOpenDesktopAppOnLoad on',
        isSafari: false,
        isFirefox: true,
        isOpenDesktopAppOnLoadEnabled: true,
    },
    {
        page: 'other browsers with MeetOpenDesktopAppOnLoad off',
        isSafari: false,
        isFirefox: false,
        isOpenDesktopAppOnLoadEnabled: false,
    },
])('PreJoinDetails on $page', ({ isSafari, isFirefox, isOpenDesktopAppOnLoadEnabled }) => {
    beforeEach(() => {
        mocks.isSafari.mockReturnValue(isSafari);
        mocks.isFirefox.mockReturnValue(isFirefox);
        mocks.flags.MeetOpenDesktopAppOnLoad = isOpenDesktopAppOnLoadEnabled;
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

        it('opens the app on load without the hint and keeps joining in the browser available when the choice was remembered', () => {
            saveDesktopAppPreference(USER_STORAGE_KEY);
            renderPreJoinDetails();

            expect(tryOpenInDesktopApp).toHaveBeenCalledWith(MEETING_LINK);
            expect(screen.queryByText("App didn't open?")).not.toBeInTheDocument();
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

    describe.each([
        { screen: 'participant', isHost: false, instantMeeting: false, action: 'Join in browser' },
        { screen: 'host', isHost: true, instantMeeting: false, action: 'Start meeting in browser' },
        { screen: 'instant meeting', isHost: false, instantMeeting: true, action: 'Start meeting' },
    ])('name field on the $screen screen', ({ isHost, instantMeeting, action }) => {
        const renderScreen = ({ displayName = 'Alice', onJoinMeeting = vi.fn() } = {}) => {
            mocks.isHost = isHost;
            return renderPreJoinDetails({ instantMeeting, displayName, onJoinMeeting });
        };
        const getNameField = () => screen.getByRole('textbox', { name: 'Name' });
        const getActionButton = () => screen.getByRole('button', { name: action });

        it('asks for a name to join', () => {
            renderScreen({ displayName: '' });

            expect(getNameField()).toHaveAttribute('placeholder', 'Enter your name to join');
        });

        it.each([
            { case: 'is empty', displayName: '' },
            { case: 'only has spaces', displayName: '   ' },
        ])('keeps the button reachable but disabled when the name $case', ({ displayName }) => {
            renderScreen({ displayName });

            expect(getActionButton()).toHaveAttribute('aria-disabled', 'true');
            expect(getActionButton()).not.toHaveAttribute('disabled');
        });

        it('enables the button once there is a name', () => {
            renderScreen();

            expect(getActionButton()).toBeEnabled();
            expect(getActionButton()).not.toHaveAttribute('aria-disabled');
        });

        it('focuses the name field instead of joining when the button is used without a name', () => {
            const onJoinMeeting = vi.fn();
            renderScreen({ displayName: '', onJoinMeeting });
            act(() => getActionButton().focus());
            expect(getActionButton()).toHaveFocus();

            fireEvent.click(getActionButton());

            expect(getNameField()).toHaveFocus();
            expect(onJoinMeeting).not.toHaveBeenCalled();
        });

        it('returns focus to the empty name field after a click on an empty area', () => {
            renderScreen({ displayName: '' });
            act(() => getNameField().blur());
            expect(getNameField()).not.toHaveFocus();

            fireEvent.click(document.body);

            expect(getNameField()).toHaveFocus();
        });

        it('joins with the name as typed when Enter is pressed in the name field', () => {
            const onJoinMeeting = vi.fn();
            renderScreen({ displayName: ' Alice ', onJoinMeeting });

            fireEvent.keyDown(getNameField(), { key: 'Enter' });

            expect(onJoinMeeting).toHaveBeenCalledWith(' Alice ', false);
        });

        it.each([
            { case: 'is empty', displayName: '' },
            { case: 'only has spaces', displayName: '   ' },
        ])('does not join when Enter is pressed and the name $case', ({ displayName }) => {
            const onJoinMeeting = vi.fn();
            renderScreen({ displayName, onJoinMeeting });

            fireEvent.keyDown(getNameField(), { key: 'Enter' });

            expect(onJoinMeeting).not.toHaveBeenCalled();
        });

        it('does not join when Enter commits an input method composition', () => {
            const onJoinMeeting = vi.fn();
            renderScreen({ onJoinMeeting });

            fireEvent.keyDown(getNameField(), { key: 'Enter', isComposing: true });

            expect(onJoinMeeting).not.toHaveBeenCalled();
        });
    });
});

describe('PreJoinDetails on other desktop browsers with MeetOpenDesktopAppOnLoad on', () => {
    beforeEach(() => {
        mocks.flags.MeetOpenDesktopAppOnLoad = true;
    });

    describe.each([
        { choice: 'no choice yet', storeChoice: () => {} },
        { choice: 'the app preferred', storeChoice: () => saveDesktopAppPreference(USER_STORAGE_KEY) },
    ])('with $choice', ({ storeChoice }) => {
        beforeEach(() => {
            storeChoice();
        });

        it.each([
            { role: 'participant', isHost: false },
            { role: 'host', isHost: true },
        ])(
            'offers the $role one "Join meeting" button, no desktop app button or hint, and tries the app only once, from the load',
            ({ isHost }) => {
                mocks.isHost = isHost;
                renderPreJoinDetails();

                expect(screen.getAllByRole('button', { name: 'Join meeting' })).toHaveLength(1);
                expect(screen.queryByRole('button', { name: OPEN_IN_DESKTOP_APP })).not.toBeInTheDocument();
                expect(screen.queryByText("App didn't open?")).not.toBeInTheDocument();
                expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
                expect(tryOpenInDesktopApp).toHaveBeenCalledWith(MEETING_LINK);
            }
        );

        it('remembers that the browser is preferred and joins when "Join meeting" is used on a page loaded on the meeting link', () => {
            const onJoinMeeting = vi.fn();
            renderPreJoinDetails({ onJoinMeeting });

            fireEvent.click(screen.getByRole('button', { name: 'Join meeting' }));

            expect(onJoinMeeting).toHaveBeenCalledWith('Alice', false);
            expect(getBrowserPreference(USER_STORAGE_KEY)).toBe(true);
        });
    });

    it('offers one "Join meeting" button and no desktop app button with MeetOpenLinksInDesktopApp off', () => {
        mocks.flags.MeetOpenLinksInDesktopApp = false;
        renderPreJoinDetails();

        expect(screen.getAllByRole('button', { name: 'Join meeting' })).toHaveLength(1);
        expect(screen.queryByRole('button', { name: OPEN_IN_DESKTOP_APP })).not.toBeInTheDocument();
    });

    describe('with the browser preferred', () => {
        beforeEach(() => {
            saveBrowserPreference(USER_STORAGE_KEY);
        });

        it.each([
            { role: 'participant', isHost: false, action: 'Join in browser' },
            { role: 'host', isHost: true, action: 'Start meeting in browser' },
        ])(
            'offers the $role "$action" and the desktop app button, without opening the app or its hint even with MeetOpenLinksInDesktopApp on',
            ({ isHost, action }) => {
                mocks.isHost = isHost;
                renderPreJoinDetails();

                expect(screen.getByRole('button', { name: action })).toBeInTheDocument();
                expect(screen.getByRole('button', { name: OPEN_IN_DESKTOP_APP })).toBeInTheDocument();
                expect(screen.queryByText("App didn't open?")).not.toBeInTheDocument();
                expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
            }
        );

        it('opens the app from the desktop app button, remembers it and keeps both buttons and the hint as the page updates', () => {
            const { rerenderPage } = renderPreJoinDetails();

            fireEvent.click(screen.getByRole('button', { name: OPEN_IN_DESKTOP_APP }));
            rerenderPage();

            expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
            expect(tryOpenInDesktopApp).toHaveBeenCalledWith(MEETING_LINK);
            expect(getDesktopAppPreference(USER_STORAGE_KEY)).toBe(true);
            expect(screen.getByText("App didn't open?")).toBeInTheDocument();
            expect(screen.getByRole('button', { name: OPEN_IN_DESKTOP_APP })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Join in browser' })).toBeEnabled();
        });

        it('keeps the browser preferred when joining in the browser', () => {
            const onJoinMeeting = vi.fn();
            renderPreJoinDetails({ onJoinMeeting });

            fireEvent.click(screen.getByRole('button', { name: 'Join in browser' }));

            expect(onJoinMeeting).toHaveBeenCalledWith('Alice', false);
            expect(getBrowserPreference(USER_STORAGE_KEY)).toBe(true);
        });

        it('keeps the browser preferred when joining in the browser after trying the app', () => {
            const onJoinMeeting = vi.fn();
            renderPreJoinDetails({ onJoinMeeting });

            fireEvent.click(screen.getByRole('button', { name: OPEN_IN_DESKTOP_APP }));
            fireEvent.click(screen.getByRole('button', { name: 'Join in browser' }));

            expect(onJoinMeeting).toHaveBeenCalledWith('Alice', false);
            expect(getBrowserPreference(USER_STORAGE_KEY)).toBe(true);
        });
    });

    it.each([
        {
            page: 'a meeting opened inside the app',
            renderPage: (onJoinMeeting: () => void) =>
                renderPreJoinDetails({ onJoinMeeting, loadedOn: DASHBOARD_PATH }),
        },
        {
            page: 'a page whose MeetOpenDesktopAppOnLoad turned on after the load',
            renderPage: (onJoinMeeting: () => void) => {
                mocks.flags.MeetOpenDesktopAppOnLoad = false;
                const { rerenderPage } = renderPreJoinDetails({ onJoinMeeting });
                mocks.flags.MeetOpenDesktopAppOnLoad = true;
                rerenderPage();
            },
        },
    ])(
        'stores no choice when "Join meeting" is used on $page, so the next load on the meeting link tries the app',
        ({ renderPage }) => {
            const onJoinMeeting = vi.fn();
            renderPage(onJoinMeeting);

            fireEvent.click(screen.getByRole('button', { name: 'Join meeting' }));

            expect(onJoinMeeting).toHaveBeenCalledWith('Alice', false);
            expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
            expect(tryOpenInDesktopApp).not.toHaveBeenCalled();

            loadPage(MEETING_PATH);

            expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
            expect(tryOpenInDesktopApp).toHaveBeenCalledWith(MEETING_LINK);
        }
    );

    it.each([
        { owner: 'another account', storageKey: OTHER_USER_STORAGE_KEY },
        { owner: 'the guest', storageKey: GUEST_STORAGE_KEY },
    ])('offers one "Join meeting" button when $owner preferred the browser', ({ storageKey }) => {
        saveBrowserPreference(storageKey);
        renderPreJoinDetails();

        expect(screen.getAllByRole('button', { name: 'Join meeting' })).toHaveLength(1);
        expect(screen.queryByRole('button', { name: OPEN_IN_DESKTOP_APP })).not.toBeInTheDocument();
    });

    it('keeps "Start meeting", no desktop app button, and stores no choice for an instant meeting', () => {
        const onJoinMeeting = vi.fn();
        renderPreJoinDetails({ instantMeeting: true, onJoinMeeting });

        expect(screen.queryByRole('button', { name: OPEN_IN_DESKTOP_APP })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Start meeting' }));

        expect(onJoinMeeting).toHaveBeenCalledWith('Alice', false);
        expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
    });

    it.each([
        { device: 'mobile', isDesktop: false, isIpad: false, isSafari: false },
        { device: 'iPad', isDesktop: true, isIpad: true, isSafari: true },
    ])('keeps "Join in browser" and no desktop app button on $device', ({ isDesktop, isIpad, isSafari }) => {
        mocks.isDesktop.mockReturnValue(isDesktop);
        mocks.isIpad.mockReturnValue(isIpad);
        mocks.isSafari.mockReturnValue(isSafari);
        renderPreJoinDetails();

        expect(screen.getByRole('button', { name: 'Join in browser' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: OPEN_IN_DESKTOP_APP })).not.toBeInTheDocument();
    });
});
