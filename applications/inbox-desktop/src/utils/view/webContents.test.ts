import type { WebContents, WindowOpenHandlerResponse } from "electron";

import { clearOAuthSession, isOAuthWindow, startOAuthSession } from "../oauthSession";
import { openExternalRedirect } from "../openExternal/openExternal";
import { handleWebContents } from "./webContents";
import { showView } from "./viewManagement";

jest.mock("../../store/urlStore", () => ({
    getAppURL: () => ({
        account: "https://account.proton.me",
        mail: "https://mail.proton.me",
        calendar: "https://calendar.proton.me",
    }),
}));
jest.mock("../log", () => {
    const logger = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };
    return {
        mainLogger: logger,
        viewLogger: () => logger,
        rendererLogger: () => logger,
        ipcLogger: logger,
        urlRedirectsLogger: logger,
    };
});
jest.mock("./viewManagement", () => ({
    getCurrentView: jest.fn(() => null),
    getWebContentsViewName: jest.fn(() => null),
    showView: jest.fn(),
}));
jest.mock("../../ipc/notification", () => ({}));
jest.mock("../sentryReport", () => ({}));
jest.mock("../openExternal/openExternal", () => ({ openExternalRedirect: jest.fn() }));
jest.mock("./utils/stuckViewTracker", () => ({}));

type Listener = (...args: unknown[]) => unknown;

const SESSION_ID = "session";
const AUTHORIZATION_URL = "https://zoom.us/oauth/authorize";
const IDENTITY_PROVIDER_URL = "https://sso.example.com/login";
const SANDBOXED_WINDOW: WindowOpenHandlerResponse = {
    action: "allow",
    overrideBrowserWindowOptions: {
        webPreferences: { preload: undefined, sandbox: true, nodeIntegration: false, contextIsolation: true },
    },
};

let nextWebContentsId = 1;

const createHandledWebContents = () => {
    const listeners = new Map<string, Listener[]>();
    const addListener = (event: string, listener: Listener) => {
        listeners.set(event, [...(listeners.get(event) ?? []), listener]);
    };
    const emit = (event: string, ...args: unknown[]) => listeners.get(event)?.forEach((listener) => listener(...args));

    let windowOpenHandler: (details: { url: string }) => WindowOpenHandlerResponse;

    const contents = {
        id: nextWebContentsId++,
        on: addListener,
        once: addListener,
        setWindowOpenHandler: (handler: typeof windowOpenHandler) => {
            windowOpenHandler = handler;
        },
    };

    handleWebContents(contents as unknown as WebContents);

    return {
        webContents: contents,
        emit,
        openWindow: (url: string) => windowOpenHandler({ url }),
        navigate: (url: string) => {
            const details = { url, preventDefault: jest.fn() };
            emit("will-navigate", details);
            return details;
        },
        createChildWindow: () => {
            const child = createHandledWebContents();
            emit("did-create-window", { webContents: child.webContents });
            return child;
        },
    };
};

const openOAuthPopup = () => {
    const mainView = createHandledWebContents();
    startOAuthSession(SESSION_ID, AUTHORIZATION_URL);
    mainView.openWindow(AUTHORIZATION_URL);
    return { mainView, popup: mainView.createChildWindow() };
};

describe("handleWebContents OAuth windows", () => {
    afterEach(() => {
        clearOAuthSession(SESSION_ID);
        jest.useRealTimers();
    });

    it("opens a URL matching an active OAuth session in a sandboxed window", () => {
        const mainView = createHandledWebContents();
        startOAuthSession(SESSION_ID, AUTHORIZATION_URL);

        expect(mainView.openWindow(`${AUTHORIZATION_URL}?state=${SESSION_ID}`)).toStrictEqual(SANDBOXED_WINDOW);
        expect(openExternalRedirect).not.toHaveBeenCalled();
    });

    it("opens an OAuth URL in the browser when no session is active", () => {
        const mainView = createHandledWebContents();

        expect(mainView.openWindow(AUTHORIZATION_URL)).toEqual({ action: "deny" });
        expect(openExternalRedirect).toHaveBeenCalledWith(AUTHORIZATION_URL);
    });

    it("tracks the popup as an OAuth window until it is destroyed", () => {
        const { popup } = openOAuthPopup();

        expect(isOAuthWindow(popup.webContents.id)).toBe(true);

        popup.emit("destroyed");

        expect(isOAuthWindow(popup.webContents.id)).toBe(false);
    });

    it("lets the popup follow a multi-hop SSO chain", () => {
        jest.useFakeTimers();
        const { popup } = openOAuthPopup();
        jest.advanceTimersByTime(10_000);

        const navigations = [
            "https://accounts.google.com/signin",
            IDENTITY_PROVIDER_URL,
            "https://accounts.google.com/consent",
            "https://account.proton.me/oauth/callback",
        ].map((url) => popup.navigate(url));

        navigations.forEach((navigation) => expect(navigation.preventDefault).not.toHaveBeenCalled());
        expect(openExternalRedirect).not.toHaveBeenCalled();
    });

    it("sends off-host navigation of a regular view to the browser", () => {
        const { mainView } = openOAuthPopup();

        const navigation = mainView.navigate(IDENTITY_PROVIDER_URL);

        expect(navigation.preventDefault).toHaveBeenCalled();
        expect(openExternalRedirect).toHaveBeenCalledWith(IDENTITY_PROVIDER_URL);
    });

    it("opens popups from an OAuth window in the browser", () => {
        const { popup } = openOAuthPopup();

        expect(popup.openWindow(IDENTITY_PROVIDER_URL)).toEqual({ action: "deny" });
        expect(openExternalRedirect).toHaveBeenCalledWith(IDENTITY_PROVIDER_URL);
    });
});

describe("handleWebContents URL rules", () => {
    const RULE_MATCHED_URLS = [
        "https://calendar.proton.me/bookings",
        "https://account.proton.me/close-ticket",
        "https://account.proton.me/born-private",
        "https://account.proton.me/signup?plan=mail2022",
        "https://account.proton.me/join-org#dD0xMjIyMw",
        "https://account.proton.me/unsubscribe/64",
    ];
    const IN_APP_URL = "https://calendar.proton.me/u/0/";

    it.each(RULE_MATCHED_URLS)("opens navigation to %s in the browser", (url) => {
        const view = createHandledWebContents();

        const navigation = view.navigate(url);

        expect(navigation.preventDefault).toHaveBeenCalled();
        expect(openExternalRedirect).toHaveBeenCalledWith(url);
    });

    it.each(RULE_MATCHED_URLS)("opens popup for %s in the browser", (url) => {
        const view = createHandledWebContents();

        expect(view.openWindow(url)).toEqual({ action: "deny" });
        expect(openExternalRedirect).toHaveBeenCalledWith(url);
        expect(showView).not.toHaveBeenCalled();
    });

    it("keeps navigation to a Proton URL without a rule in-app", () => {
        const view = createHandledWebContents();

        const navigation = view.navigate(IN_APP_URL);

        expect(navigation.preventDefault).not.toHaveBeenCalled();
        expect(openExternalRedirect).not.toHaveBeenCalled();
    });

    it("shows a popup for a Proton URL without a rule in its view", () => {
        const view = createHandledWebContents();

        expect(view.openWindow(IN_APP_URL)).toEqual({ action: "deny" });
        expect(showView).toHaveBeenCalledWith("calendar", IN_APP_URL);
        expect(openExternalRedirect).not.toHaveBeenCalled();
    });
});
