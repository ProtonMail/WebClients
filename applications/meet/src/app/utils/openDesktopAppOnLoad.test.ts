import type { FeatureFlag } from '@proton/unleash/Flags';

import { saveBrowserPreference, saveDesktopAppPreference, tryOpenInDesktopApp } from './desktopAppDetector';
import { openDesktopAppOnLoad, openDesktopAppOnPreJoin } from './openDesktopAppOnLoad';

const mocks = vi.hoisted(() => ({
    isElectronApp: false,
    isDesktop: vi.fn(),
    isIpad: vi.fn(),
    isSafari: vi.fn(),
    isFirefox: vi.fn(),
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

vi.mock('./desktopAppDetector', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    tryOpenInDesktopApp: vi.fn(),
}));

const MEETING_ID = 'meetingabc';
const MEETING_PASSWORD = 'passwordabcd';
const MEETING_PATH = `/join/id-${MEETING_ID}#pwd-${MEETING_PASSWORD}`;
const GUEST_MEETING_PATH = `/guest/join/id-${MEETING_ID}#pwd-${MEETING_PASSWORD}`;
const USER_ID = 'user-1';
const USER_STORAGE_KEY = 'openInDesktopApp.user.user-1';
const OTHER_USER_STORAGE_KEY = 'openInDesktopApp.user.user-2';
const GUEST_STORAGE_KEY = 'openInDesktopApp.guest';

const loadPage = ({
    path = MEETING_PATH,
    flags = { MeetOpenDesktopAppOnLoad: true },
    guest = false,
}: { path?: string; flags?: Partial<Record<FeatureFlag, boolean>>; guest?: boolean } = {}) => {
    window.history.replaceState(null, '', path);

    openDesktopAppOnLoad({
        unleashClient: { isEnabled: (flag: FeatureFlag) => flags[flag] ?? false },
        userId: guest ? undefined : USER_ID,
    });
};

const openPreJoin = ({
    isOpenDesktopAppOnLoadEnabled = true,
    desktopAppPreferenceStorageKey = USER_STORAGE_KEY,
} = {}) => openDesktopAppOnPreJoin({ isOpenDesktopAppOnLoadEnabled, desktopAppPreferenceStorageKey });

const FULL_MEETING_LINK = `${window.location.origin}/join/id-meetingabc#pwd-passwordabcd`;

describe('openDesktopAppOnLoad', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mocks.isElectronApp = false;
        mocks.isDesktop.mockReturnValue(true);
        mocks.isIpad.mockReturnValue(false);
        mocks.isSafari.mockReturnValue(false);
        mocks.isFirefox.mockReturnValue(false);
    });

    it.each([
        { visitor: 'a signed-in user', path: MEETING_PATH, guest: false },
        { visitor: 'a guest', path: GUEST_MEETING_PATH, guest: true },
    ])('opens the meeting in the desktop app once, with its full join link, for $visitor', ({ path, guest }) => {
        loadPage({ path, guest });

        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
        expect(tryOpenInDesktopApp).toHaveBeenCalledWith(FULL_MEETING_LINK);
    });

    it('opens the app when the app was preferred', () => {
        saveDesktopAppPreference(USER_STORAGE_KEY);

        loadPage();

        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
    });

    it.each([
        { visitor: 'a signed-in user', path: MEETING_PATH, guest: false, storageKey: USER_STORAGE_KEY },
        { visitor: 'a guest', path: GUEST_MEETING_PATH, guest: true, storageKey: GUEST_STORAGE_KEY },
    ])('does not open the app when $visitor preferred the browser', ({ path, guest, storageKey }) => {
        saveBrowserPreference(storageKey);

        loadPage({ path, guest });

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
    });

    it.each([
        { owner: 'another account', storageKey: OTHER_USER_STORAGE_KEY },
        { owner: 'the guest', storageKey: GUEST_STORAGE_KEY },
    ])('opens the app for a signed-in user when $owner preferred the browser', ({ storageKey }) => {
        saveBrowserPreference(storageKey);

        loadPage();

        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
    });

    it('opens the app for a guest when a signed-in account preferred the browser', () => {
        saveBrowserPreference(USER_STORAGE_KEY);

        loadPage({ path: GUEST_MEETING_PATH, guest: true });

        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
    });

    it('does not open the app when MeetOpenDesktopAppOnLoad is off', () => {
        loadPage({ flags: { MeetOpenDesktopAppOnLoad: false } });

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
    });

    it.each([
        { browser: 'Safari', isSafari: true, isFirefox: false },
        { browser: 'Firefox', isSafari: false, isFirefox: true },
    ])('does not open the app on $browser', ({ isSafari, isFirefox }) => {
        mocks.isSafari.mockReturnValue(isSafari);
        mocks.isFirefox.mockReturnValue(isFirefox);

        loadPage();

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
    });

    it.each([
        { device: 'mobile', isDesktop: false, isIpad: false, isSafari: false },
        { device: 'iPad', isDesktop: true, isIpad: true, isSafari: true },
    ])('does not open the app on $device', ({ isDesktop, isIpad, isSafari }) => {
        mocks.isDesktop.mockReturnValue(isDesktop);
        mocks.isIpad.mockReturnValue(isIpad);
        mocks.isSafari.mockReturnValue(isSafari);

        loadPage();

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
    });

    it('stops at once inside the desktop app: no attempt, no flag read, and nothing remembered as tried', () => {
        loadPage();
        vi.mocked(tryOpenInDesktopApp).mockClear();
        mocks.isElectronApp = true;
        const isEnabled = vi.fn(() => true);

        openDesktopAppOnLoad({ unleashClient: { isEnabled }, userId: USER_ID });

        expect(isEnabled).not.toHaveBeenCalled();
        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();

        mocks.isElectronApp = false;
        openPreJoin();

        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
    });

    it.each([
        { page: 'the dashboard', path: '/dashboard' },
        { page: 'an instant meeting', path: '/join' },
        { page: 'a meeting link without its password', path: `/join/id-${MEETING_ID}` },
        { page: 'an invalid meeting id', path: `/join/id-short#pwd-${MEETING_PASSWORD}` },
        { page: 'an invalid meeting password', path: `/join/id-${MEETING_ID}#pwd-short` },
    ])('does not open the app for a page loaded on $page', ({ path }) => {
        loadPage({ path });

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
    });

    describe('openDesktopAppOnPreJoin', () => {
        const openMeeting = (path: string) => window.history.pushState(null, '', path);

        it('opens a meeting opened from the dashboard once, with its full join link', () => {
            loadPage({ path: '/dashboard' });
            openMeeting(MEETING_PATH);

            openPreJoin();
            openPreJoin();

            expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
            expect(tryOpenInDesktopApp).toHaveBeenCalledWith(FULL_MEETING_LINK);
        });

        it('does not open again the meeting the page load opened', () => {
            loadPage();

            openPreJoin();

            expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
        });

        it('opens another meeting opened after the one the page load opened', () => {
            loadPage();
            openMeeting(`/join/id-othermeeti#pwd-${MEETING_PASSWORD}`);

            openPreJoin();

            expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(2);
            expect(tryOpenInDesktopApp).toHaveBeenLastCalledWith(
                `${window.location.origin}/join/id-othermeeti#pwd-${MEETING_PASSWORD}`
            );
        });

        it.each([
            { case: 'MeetOpenDesktopAppOnLoad is off', isEnabled: false, isSafari: false },
            { case: 'on Safari', isEnabled: true, isSafari: true },
        ])('does not open the app when $case', ({ isEnabled, isSafari }) => {
            mocks.isSafari.mockReturnValue(isSafari);
            loadPage({ path: '/dashboard' });
            openMeeting(MEETING_PATH);

            openPreJoin({ isOpenDesktopAppOnLoadEnabled: isEnabled });

            expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
        });

        it.each([
            { case: 'MeetOpenDesktopAppOnLoad is off', isEnabled: false, isSafari: false },
            { case: 'on Safari', isEnabled: true, isSafari: true },
        ])('opens the meeting once when the app was chosen and $case', ({ isEnabled, isSafari }) => {
            mocks.isSafari.mockReturnValue(isSafari);
            saveDesktopAppPreference(USER_STORAGE_KEY);
            loadPage({ flags: { MeetOpenDesktopAppOnLoad: isEnabled } });
            expect(tryOpenInDesktopApp).not.toHaveBeenCalled();

            openPreJoin({ isOpenDesktopAppOnLoadEnabled: isEnabled });
            openPreJoin({ isOpenDesktopAppOnLoadEnabled: isEnabled });

            expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
            expect(tryOpenInDesktopApp).toHaveBeenCalledWith(FULL_MEETING_LINK);
        });

        it('does not open the app inside the desktop app, even when the app was chosen', () => {
            saveDesktopAppPreference(USER_STORAGE_KEY);
            loadPage();
            vi.mocked(tryOpenInDesktopApp).mockClear();
            mocks.isElectronApp = true;
            openMeeting(`/join/id-othermeeti#pwd-${MEETING_PASSWORD}`);

            openPreJoin();

            expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
        });

        it('does not open the app when the browser was preferred', () => {
            saveBrowserPreference(USER_STORAGE_KEY);
            loadPage({ path: '/dashboard' });
            openMeeting(MEETING_PATH);

            openPreJoin();

            expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
        });

        it('does not open the app for an instant meeting', () => {
            loadPage({ path: '/dashboard' });
            openMeeting('/join');

            openPreJoin();

            expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
        });
    });
});
