import { IpcMainEvent, IpcMainInvokeEvent, ipcMain } from "electron";
import { handleIPCCalls } from "./main";
import { ipcLogger } from "../utils/log";
import { getTheme } from "../utils/themes";
import { storeAppVersion } from "../utils/appVersions";
import { getLogs } from "../utils/log/getLogsIPC";

jest.mock("electron", () => ({
    ipcMain: { on: jest.fn(), handle: jest.fn() },
}));

jest.mock("../store/urlStore", () => ({
    getAppURL: () => ({
        account: "https://account.proton.me",
        mail: "https://mail.proton.me",
        calendar: "https://calendar.proton.me",
    }),
}));

jest.mock("../utils/log", () => ({
    ipcLogger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock("../utils/themes", () => ({ getTheme: jest.fn(() => "mocked-theme") }));
jest.mock("../utils/appVersions", () => ({ storeAppVersion: jest.fn() }));
jest.mock("../utils/log/getLogsIPC", () => ({ getLogs: jest.fn(async () => "logs") }));
jest.mock("../utils/profiler/profiler", () => ({ profiler: { ipcMessage: jest.fn() } }));
jest.mock("../utils/sentryReport");

jest.mock("../store/settingsStore", () => ({}));
jest.mock("../update/update", () => ({}));
jest.mock("../utils/helpers", () => ({}));
jest.mock("../utils/view/viewManagement", () => ({}));
jest.mock("./notification", () => ({}));
jest.mock("../store/installInfoStore", () => ({}));
jest.mock("../store/userSettingsStore", () => ({}));
jest.mock("../utils/protocol/default", () => ({}));
jest.mock("../utils/metrics", () => ({}));
jest.mock("../utils/telemetry", () => ({}));
jest.mock("../utils/appCache", () => ({}));
jest.mock("../utils/logout/logout", () => ({}));
jest.mock("../utils/oauthProcess", () => ({}));
jest.mock("../utils/openExternal/openExternal", () => ({}));
jest.mock("../utils/openExternal/manager", () => ({}));
jest.mock("../utils/urlRedirects/manager", () => ({}));
jest.mock("../utils/auth/authPoller", () => ({}));

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

    for (const [channel, handler] of [
        ...(ipcMain.on as jest.Mock).mock.calls,
        ...(ipcMain.handle as jest.Mock).mock.calls,
    ]) {
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

    it("logs the rejected channel and origin", () => {
        handlers.clientUpdate(eventFrom("https://evil.com"), { type: "storeAppVersion", payload: "1.0.0" });

        expect(ipcLogger.warn).toHaveBeenCalledWith("Rejected clientUpdate IPC from origin: https://evil.com");
    });
});
