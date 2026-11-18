import type { Mock } from "vitest";
import { IpcMainEvent, IpcMainInvokeEvent, ipcMain } from "electron";
import { handleIPCCalls } from "./main";
import { ipcLogger } from "../utils/log";
import { getTheme } from "../utils/themes";
import { storeAppVersion } from "../utils/appVersions";
import { getLogs } from "../utils/log/getLogsIPC";
import { getProfilerReports } from "../utils/profiler/reports";
import { clearOAuthSession, startOAuthSession } from "../utils/oauthSession";

vi.mock("electron", () => ({
    ipcMain: { on: vi.fn(), handle: vi.fn() },
}));

vi.mock("../store/urlStore", () => ({
    getAppURL: () => ({
        account: "https://account.proton.me",
        mail: "https://mail.proton.me",
        calendar: "https://calendar.proton.me",
    }),
}));

vi.mock("../utils/log", () => ({
    ipcLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock("../utils/themes", () => ({ getTheme: vi.fn(() => "mocked-theme") }));
vi.mock("../utils/appVersions", () => ({ storeAppVersion: vi.fn() }));
vi.mock("../utils/log/getLogsIPC", () => ({ getLogs: vi.fn(async () => "logs") }));
vi.mock("../utils/profiler/profiler", () => ({ profiler: { ipcMessage: vi.fn() } }));
vi.mock("../utils/profiler/reports", () => ({ getProfilerReports: vi.fn(async () => []) }));
vi.mock("../utils/sentryReport");

vi.mock("../store/settingsStore", () => ({}));
vi.mock("../update/update", () => ({}));
vi.mock("../utils/helpers", () => ({}));
vi.mock("../utils/view/viewManagement", () => ({}));
vi.mock("./notification", () => ({}));
vi.mock("../store/installInfoStore", () => ({}));
vi.mock("../store/userSettingsStore", () => ({}));
vi.mock("../utils/protocol/default", () => ({}));
vi.mock("../utils/metrics", () => ({}));
vi.mock("../utils/telemetry", () => ({}));
vi.mock("../utils/logout/logout", () => ({}));
vi.mock("../utils/oauthSession", () => ({ startOAuthSession: vi.fn(), clearOAuthSession: vi.fn() }));
vi.mock("../utils/openExternal/openExternal", () => ({}));
vi.mock("../utils/openExternal/manager", () => ({}));
vi.mock("../utils/urlRedirects/manager", () => ({}));
vi.mock("../utils/auth/authPoller", () => ({}));

type Handler = (event: IpcMainEvent | IpcMainInvokeEvent, ...args: unknown[]) => unknown;

const handlers: Record<string, Handler> = {};

const eventFrom = (origin?: string) =>
    ({ senderFrame: origin === undefined ? null : { origin }, returnValue: undefined }) as unknown as IpcMainEvent;

const UNTRUSTED_ORIGINS = [
    ["foreign site", "https://evil.com"],
    ["foreign site 2", "https://oauth2.microsoft.com"],
    ["lookalike suffix", "https://mail.proton.me.evil.com"],
    ["different port", "https://mail.proton.me:8443"],
    ["http scheme", "http://mail.proton.me"],
    ["opaque origin", "null"],
    ["missing sender frame", undefined],
] as const;

beforeAll(() => {
    handleIPCCalls();

    for (const [channel, handler] of [...(ipcMain.on as Mock).mock.calls, ...(ipcMain.handle as Mock).mock.calls]) {
        handlers[channel] = handler;
    }
});

describe("IPC sender origin validation", () => {
    it.each(["https://account.proton.me", "https://mail.proton.me", "https://calendar.proton.me"])(
        "accepts sync calls from %s",
        (origin) => {
            const event = eventFrom(origin);

            handlers.getInfo(event, "theme");

            expect(event.returnValue).toBe("mocked-theme");
        },
    );

    it.each(UNTRUSTED_ORIGINS)("rejects getInfo from %s and still replies", (_, origin) => {
        const event = eventFrom(origin);

        handlers.getInfo(event, "theme");

        expect(event.returnValue).toBeNull();
        expect(getTheme).not.toHaveBeenCalled();
    });

    it.each(UNTRUSTED_ORIGINS)("rejects hasFeature from %s and replies false", (_, origin) => {
        const event = eventFrom(origin);

        handlers.hasFeature(event, "ThemeSelection");

        expect(event.returnValue).toBe(false);
    });

    it.each(UNTRUSTED_ORIGINS)("rejects getUserInfo from %s and still replies", (_, origin) => {
        const event = eventFrom(origin);

        handlers.getUserInfo(event, "esUserChoice", "user-1");

        expect(event.returnValue).toBeNull();
    });

    it("handles clientUpdate from a trusted origin", () => {
        handlers.clientUpdate(eventFrom("https://mail.proton.me"), { type: "storeAppVersion", payload: "1.0.0" });

        expect(storeAppVersion).toHaveBeenCalledWith("1.0.0");
    });

    it.each(UNTRUSTED_ORIGINS)("ignores clientUpdate from %s", (_, origin) => {
        handlers.clientUpdate(eventFrom(origin), { type: "storeAppVersion", payload: "1.0.0" });

        expect(storeAppVersion).not.toHaveBeenCalled();
    });

    it.each(UNTRUSTED_ORIGINS)("does not serve getAsyncData to %s", async (_, origin) => {
        await expect(handlers.getAsyncData(eventFrom(origin), "getElectronLogs", 1000)).resolves.toBeNull();

        expect(getLogs).not.toHaveBeenCalled();
    });

    it.each(UNTRUSTED_ORIGINS)("does not serve profiler reports to %s", async (_, origin) => {
        await expect(handlers.getAsyncData(eventFrom(origin), "getProfilerReports", 1000)).resolves.toBeNull();

        expect(getProfilerReports).not.toHaveBeenCalled();
    });

    it("logs the rejected channel and origin", () => {
        handlers.clientUpdate(eventFrom("https://evil.com"), { type: "storeAppVersion", payload: "1.0.0" });

        expect(ipcLogger.warn).toHaveBeenCalledWith("Rejected clientUpdate IPC from origin: https://evil.com");
    });
});

describe("oauthPopupOpenedV2", () => {
    const TRUSTED_ORIGIN = "https://mail.proton.me";
    const SESSION_ID = "session";
    const AUTHORIZATION_URL = "https://account.proton.me/api/oauth/google";
    const startedMessage = {
        type: "oauthPopupOpenedV2",
        payload: { action: "oauthPopupStarted", sessionId: SESSION_ID, authorizationUrl: AUTHORIZATION_URL },
    };

    it("starts an OAuth session when the popup opens", () => {
        handlers.clientUpdate(eventFrom(TRUSTED_ORIGIN), startedMessage);

        expect(startOAuthSession).toHaveBeenCalledWith(SESSION_ID, AUTHORIZATION_URL);
        expect(clearOAuthSession).not.toHaveBeenCalled();
    });

    it("clears the OAuth session when the popup finishes", () => {
        handlers.clientUpdate(eventFrom(TRUSTED_ORIGIN), {
            type: "oauthPopupOpenedV2",
            payload: { action: "oauthPopupFinished", sessionId: SESSION_ID },
        });

        expect(clearOAuthSession).toHaveBeenCalledWith(SESSION_ID);
        expect(startOAuthSession).not.toHaveBeenCalled();
    });

    it.each(UNTRUSTED_ORIGINS)("does not start an OAuth session from %s", (_, origin) => {
        handlers.clientUpdate(eventFrom(origin), startedMessage);

        expect(startOAuthSession).not.toHaveBeenCalled();
    });
});
