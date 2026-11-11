import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { connectionReducer, setJoiningInProgress } from '@proton/meet/store/slices/connectionSlice';
import {
    currentMeetingReducer,
    resetCurrentMeeting,
    setCurrentMeeting,
} from '@proton/meet/store/slices/currentMeeting';
import type { MeetingInfoModel } from '@proton/meet/store/slices/meetingInfoModel';
import { meetingInfoModelReducer, resetMeetingInfoModel } from '@proton/meet/store/slices/meetingInfoModel';
import { CustomPasswordState } from '@proton/shared/lib/interfaces/Meet';
import type { FeatureFlag } from '@proton/unleash/Flags';

import { tryOpenInDesktopApp } from './desktopAppDetector';
import { startDesktopAppLaunchOnLoad } from './startDesktopAppLaunchOnLoad';

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

const loadedMeetingInfo: MeetingInfoModel = {
    meetingLinkName: MEETING_ID,
    meetingName: 'Weekly sync',
    meetingInfo: {
        MeetingLinkName: MEETING_ID,
        Salt: 'salt',
        SessionKey: 'session-key',
        MeetingName: 'encrypted-name',
        CustomPassword: CustomPasswordState.NO_PASSWORD,
        Locked: 0,
        MaxDuration: 3600,
        MaxParticipants: 100,
        ExpirationTime: null,
    },
};

const loadPage = ({
    path = MEETING_PATH,
    flags = { MeetOpenDesktopAppOnLoad: true },
    isMeetingInfoLoaded = true,
}: { path?: string; flags?: Partial<Record<FeatureFlag, boolean>>; isMeetingInfoLoaded?: boolean } = {}) => {
    window.history.replaceState(null, '', path);

    let servedFlags = flags;
    const unleashClient = { isEnabled: (flag: FeatureFlag) => servedFlags[flag] ?? false };

    const listenerMiddleware = createListenerMiddleware();

    const store = configureStore({
        reducer: { ...currentMeetingReducer, ...meetingInfoModelReducer, ...connectionReducer },
        preloadedState: {
            meetingInfoModel: {
                value: isMeetingInfoLoaded ? loadedMeetingInfo : undefined,
                error: undefined,
                meta: { fetchedAt: 0, fetchedEphemeral: true },
            },
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({ serializableCheck: false }).prepend(listenerMiddleware.middleware),
    });

    const desktopAppOption = startDesktopAppLaunchOnLoad({ dispatch: store.dispatch, unleashClient });

    const showMeetingLink = () =>
        store.dispatch(setCurrentMeeting({ meetingLinkName: MEETING_ID, meetingPassword: MEETING_PASSWORD }));
    const finishLoading = () => store.dispatch(setCurrentMeeting({ isMeetingLoading: false }));

    return {
        desktopAppOption,
        receiveNewerFlags: (newerFlags: Partial<Record<FeatureFlag, boolean>>) => {
            servedFlags = newerFlags;
        },
        showMeetingLink,
        finishLoading,
        showLoadedMeeting: () => {
            showMeetingLink();
            finishLoading();
        },
        startJoinInBrowser: () => store.dispatch(setJoiningInProgress(true)),
        failJoin: () => store.dispatch(setJoiningInProgress(false)),
        returnToPrejoin: () => {
            store.dispatch(resetCurrentMeeting());
            showMeetingLink();
            finishLoading();
        },
        leaveJoinPage: () => {
            store.dispatch(resetCurrentMeeting());
            store.dispatch(resetMeetingInfoModel());
        },
        receiveMeetingInfo: () => store.dispatch({ type: 'meetingInfoModel/fulfilled', payload: loadedMeetingInfo }),
    };
};

const FULL_MEETING_LINK = `${window.location.origin}/join/id-meetingabc#pwd-passwordabcd`;

describe('startDesktopAppLaunchOnLoad', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.isElectronApp = false;
        mocks.isDesktop.mockReturnValue(true);
        mocks.isIpad.mockReturnValue(false);
        mocks.isSafari.mockReturnValue(false);
        mocks.isFirefox.mockReturnValue(false);
    });

    it('opens the meeting in the desktop app with its full link once it has loaded', () => {
        const page = loadPage();

        page.showMeetingLink();
        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();

        page.finishLoading();
        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
        expect(tryOpenInDesktopApp).toHaveBeenCalledWith(FULL_MEETING_LINK);
    });

    it('opens the app with the full link when loading ends before the link arrives', () => {
        const page = loadPage();

        page.finishLoading();
        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();

        page.showMeetingLink();
        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
        expect(tryOpenInDesktopApp).toHaveBeenCalledWith(FULL_MEETING_LINK);
    });

    it('opens the app at most once per page load, despite a failed join and a return to the prejoin', () => {
        const page = loadPage();

        page.showLoadedMeeting();
        page.startJoinInBrowser();
        page.failJoin();
        page.returnToPrejoin();

        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
    });

    it('never opens the app once a join in the browser started first', () => {
        const page = loadPage();

        page.showMeetingLink();
        page.startJoinInBrowser();
        page.finishLoading();
        page.failJoin();
        page.returnToPrejoin();

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
    });

    it.each([
        { page: 'the dashboard', path: '/dashboard' },
        { page: 'an instant meeting', path: '/join' },
        { page: 'a meeting link without its password', path: `/join/id-${MEETING_ID}` },
        { page: 'an invalid meeting link', path: `/join/id-${MEETING_ID}#pwd-short` },
    ])('does not open the app for a page loaded on $page, even when a meeting loads later', ({ path }) => {
        const page = loadPage({ path });

        page.showLoadedMeeting();

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
        expect(page.desktopAppOption).toBe('openOnLoad');
    });

    it('does not open the app for a meeting whose info did not load', () => {
        const page = loadPage({ isMeetingInfoLoaded: false });

        page.showLoadedMeeting();

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
    });

    it('does not open the app for the same meeting opened again after leaving a page whose meeting info did not load', () => {
        const page = loadPage({ isMeetingInfoLoaded: false });

        page.showLoadedMeeting();
        page.leaveJoinPage();
        page.showLoadedMeeting();
        page.receiveMeetingInfo();

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
    });

    it('opens the app with the full link when the meeting info arrives after loading ended', () => {
        const page = loadPage({ isMeetingInfoLoaded: false });

        page.showLoadedMeeting();
        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();

        page.receiveMeetingInfo();
        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
        expect(tryOpenInDesktopApp).toHaveBeenCalledWith(FULL_MEETING_LINK);
    });

    it.each([
        { browser: 'Safari', isSafari: true, isFirefox: false },
        { browser: 'Firefox', isSafari: false, isFirefox: true },
    ])('does not open the app on $browser', ({ isSafari, isFirefox }) => {
        mocks.isSafari.mockReturnValue(isSafari);
        mocks.isFirefox.mockReturnValue(isFirefox);
        const page = loadPage();

        page.showLoadedMeeting();

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
        expect(page.desktopAppOption).toBe('appButton');
    });

    it('does not open the app when MeetOpenDesktopAppOnLoad is off, even with MeetOpenLinksInDesktopApp on', () => {
        const page = loadPage({ flags: { MeetOpenLinksInDesktopApp: true } });

        page.showLoadedMeeting();

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
        const page = loadPage();

        page.showLoadedMeeting();

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
        expect(page.desktopAppOption).toBe('unavailable');
    });

    it('opens the app with the full link and gives the page "openOnLoad" when a cached flag on is refreshed off after the page loaded', () => {
        const page = loadPage({ flags: { MeetOpenDesktopAppOnLoad: true } });

        page.receiveNewerFlags({ MeetOpenDesktopAppOnLoad: false });
        page.showLoadedMeeting();

        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
        expect(tryOpenInDesktopApp).toHaveBeenCalledWith(FULL_MEETING_LINK);
        expect(page.desktopAppOption).toBe('openOnLoad');
    });

    it('never opens the app and gives the page "appButton" when a cached flag off is refreshed on after the page loaded', () => {
        const page = loadPage({ flags: { MeetOpenDesktopAppOnLoad: false } });

        page.receiveNewerFlags({ MeetOpenDesktopAppOnLoad: true });
        page.showLoadedMeeting();

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
        expect(page.desktopAppOption).toBe('appButton');
    });
});
