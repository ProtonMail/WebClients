import type { FeatureFlag } from '@proton/unleash/Flags';

import { saveBrowserPreference, saveDesktopAppPreference, tryOpenInDesktopApp } from './desktopAppDetector';
import { openDesktopAppOnLoad } from './openDesktopAppOnLoad';

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
    userId,
}: { path?: string; flags?: Partial<Record<FeatureFlag, boolean>>; userId?: string } = {}) => {
    window.history.replaceState(null, '', path);

    openDesktopAppOnLoad({ unleashClient: { isEnabled: (flag: FeatureFlag) => flags[flag] ?? false }, userId });
};

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
        { visitor: 'a signed-in user', path: MEETING_PATH, userId: USER_ID },
        { visitor: 'a guest', path: GUEST_MEETING_PATH, userId: undefined },
    ])('opens the meeting in the desktop app once, with its full join link, for $visitor', ({ path, userId }) => {
        loadPage({ path, userId });

        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
        expect(tryOpenInDesktopApp).toHaveBeenCalledWith(FULL_MEETING_LINK);
    });

    it('opens the app when the app was preferred', () => {
        saveDesktopAppPreference(USER_STORAGE_KEY);

        loadPage({ userId: USER_ID });

        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
    });

    it.each([
        { visitor: 'a signed-in user', path: MEETING_PATH, userId: USER_ID, storageKey: USER_STORAGE_KEY },
        { visitor: 'a guest', path: GUEST_MEETING_PATH, userId: undefined, storageKey: GUEST_STORAGE_KEY },
    ])('does not open the app when $visitor preferred the browser', ({ path, userId, storageKey }) => {
        saveBrowserPreference(storageKey);

        loadPage({ path, userId });

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
    });

    it.each([
        { owner: 'another account', storageKey: OTHER_USER_STORAGE_KEY },
        { owner: 'the guest', storageKey: GUEST_STORAGE_KEY },
    ])('opens the app for a signed-in user when $owner preferred the browser', ({ storageKey }) => {
        saveBrowserPreference(storageKey);

        loadPage({ userId: USER_ID });

        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
    });

    it('opens the app for a guest when a signed-in account preferred the browser', () => {
        saveBrowserPreference(USER_STORAGE_KEY);

        loadPage({ path: GUEST_MEETING_PATH });

        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
    });

    it('does not open the app when MeetOpenDesktopAppOnLoad is off, even with MeetOpenLinksInDesktopApp on', () => {
        loadPage({ flags: { MeetOpenDesktopAppOnLoad: false, MeetOpenLinksInDesktopApp: true }, userId: USER_ID });

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
    });

    it.each([
        { browser: 'Safari', isSafari: true, isFirefox: false },
        { browser: 'Firefox', isSafari: false, isFirefox: true },
    ])('does not open the app on $browser', ({ isSafari, isFirefox }) => {
        mocks.isSafari.mockReturnValue(isSafari);
        mocks.isFirefox.mockReturnValue(isFirefox);

        loadPage({ userId: USER_ID });

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
    });

    it.each([
        { device: 'mobile', isDesktop: false, isIpad: false, isSafari: false, isElectronApp: false },
        { device: 'iPad', isDesktop: true, isIpad: true, isSafari: true, isElectronApp: false },
        { device: 'the desktop app', isDesktop: true, isIpad: false, isSafari: false, isElectronApp: true },
    ])('does not open the app on $device', ({ isDesktop, isIpad, isSafari, isElectronApp }) => {
        mocks.isDesktop.mockReturnValue(isDesktop);
        mocks.isIpad.mockReturnValue(isIpad);
        mocks.isSafari.mockReturnValue(isSafari);
        mocks.isElectronApp = isElectronApp;

        loadPage({ userId: USER_ID });

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
    });

    it.each([
        { page: 'the dashboard', path: '/dashboard' },
        { page: 'an instant meeting', path: '/join' },
        { page: 'a meeting link without its password', path: `/join/id-${MEETING_ID}` },
        { page: 'an invalid meeting id', path: `/join/id-short#pwd-${MEETING_PASSWORD}` },
        { page: 'an invalid meeting password', path: `/join/id-${MEETING_ID}#pwd-short` },
    ])('does not open the app for a page loaded on $page', ({ path }) => {
        loadPage({ path, userId: USER_ID });

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
    });
});
