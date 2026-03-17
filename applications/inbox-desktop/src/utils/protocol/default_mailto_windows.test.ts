jest.mock("electron", () => ({
    app: { on: jest.fn() },
    shell: { openExternal: jest.fn() },
}));

jest.mock(
    "electron-store",
    () =>
        class {
            get = jest.fn();
            set = jest.fn();
            delete = jest.fn();
        },
);

jest.mock("../log", () => ({
    protocolLogger: { info: jest.fn(), error: jest.fn(), log: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

jest.mock("node:child_process", () => ({
    execSync: jest.fn(),
    spawn: jest.fn(),
}));

jest.mock("node:os", () => ({
    release: jest.fn(),
}));

jest.mock("./setup_mailto_windows", () => ({
    getRegExe: jest.fn().mockReturnValue("C:\\Windows\\System32\\reg.exe"),
}));

import { checkDefaultMailtoClientWindows, setDefaultMailtoWindows } from "./default_mailto_windows";
import { execSync } from "node:child_process";
import { shell } from "electron";
import os from "node:os";
import { UNCHECKED_PROTOCOL } from "@proton/shared/lib/desktop/DefaultProtocol";

const mockedExecSync = jest.mocked(execSync);
const mockedShell = shell as jest.Mocked<typeof shell>;
const mockedOsRelease = jest.mocked(os.release);

const makeUserChoiceOutput = (progId: string) =>
    `\nHKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\mailto\\UserChoice\n    ProgId    REG_SZ    ${progId}\n`;

const makeProgIdCommandOutput = (exeName: string) =>
    `\nHKEY_CURRENT_USER\\SOFTWARE\\Classes\\ProtonMail.Url.mailto\\shell\\open\\command\n    (Default)    REG_SZ    "C:\\Users\\user\\AppData\\Local\\proton_mail\\${exeName}" %1\n`;

describe("checkDefaultMailtoClientWindows", () => {
    const MOCK_EXEC_PATH = "/mock/proton_mail/app-1.8.0/Proton Mail.exe";
    let originalExecPath: string;

    beforeEach(() => {
        originalExecPath = process.execPath;
        Object.defineProperty(process, "execPath", {
            value: MOCK_EXEC_PATH,
            writable: true,
            configurable: true,
        });
    });

    afterEach(() => {
        Object.defineProperty(process, "execPath", {
            value: originalExecPath,
            writable: true,
            configurable: true,
        });
    });

    it("returns UNCHECKED_PROTOCOL when the command value does not contain the current exe name", () => {
        mockedExecSync.mockReturnValueOnce(Buffer.from(makeProgIdCommandOutput("SomeOther Mail.exe")));

        expect(checkDefaultMailtoClientWindows()).toEqual(UNCHECKED_PROTOCOL);
    });

    it("returns UNCHECKED_PROTOCOL when the UserChoice registry query throws", () => {
        mockedExecSync
            .mockReturnValueOnce(Buffer.from(makeProgIdCommandOutput("Proton Mail.exe")))
            .mockImplementationOnce(() => {
                throw new Error("ERROR 1");
            })
            .mockImplementationOnce(() => {
                throw new Error("ERROR 2");
            });

        expect(checkDefaultMailtoClientWindows()).toEqual(UNCHECKED_PROTOCOL);
    });

    it("returns { isDefault: true, wasChecked: true } when UserChoice ProgId is ProtonMail.Url.mailto", () => {
        mockedExecSync
            .mockReturnValueOnce(Buffer.from(makeProgIdCommandOutput("Proton Mail.exe")))
            .mockReturnValueOnce(Buffer.from(makeUserChoiceOutput("ProtonMail.Url.mailto")));

        expect(checkDefaultMailtoClientWindows()).toEqual({ isDefault: true, wasChecked: true });
    });

    it("returns { isDefault: false, wasChecked: true } when UserChoice ProgId is a different app", () => {
        mockedExecSync
            .mockReturnValueOnce(Buffer.from(makeProgIdCommandOutput("Proton Mail.exe")))
            .mockReturnValueOnce(Buffer.from(makeUserChoiceOutput("Outlook.URL.mailto.001")));

        expect(checkDefaultMailtoClientWindows()).toEqual({ isDefault: false, wasChecked: true });
    });

    it("uses the exe name derived from process.execPath (not a hardcoded string)", () => {
        Object.defineProperty(process, "execPath", {
            value: "/mock/proton_mail/app-15.0.0/Proton Mail Beta.exe",
            writable: true,
            configurable: true,
        });

        mockedExecSync
            .mockReturnValueOnce(Buffer.from(makeProgIdCommandOutput("Proton Mail Beta.exe")))
            .mockReturnValueOnce(Buffer.from(makeUserChoiceOutput("ProtonMail.Url.mailto")));

        expect(checkDefaultMailtoClientWindows()).toEqual({ isDefault: true, wasChecked: true });
    });

    it("fallbacks to userChoice instead of UserChoiceLatest if the result does not contain ProtonMail.Url.mailto", () => {
        mockedExecSync
            .mockReturnValueOnce(Buffer.from(makeProgIdCommandOutput("Proton Mail.exe")))
            .mockReturnValueOnce(Buffer.from(makeUserChoiceOutput("doesnotexist.exe")))
            .mockReturnValueOnce(Buffer.from(makeUserChoiceOutput("ProtonMail.Url.mailto")));

        const result = checkDefaultMailtoClientWindows();

        expect(mockedExecSync).toHaveBeenCalledTimes(3);
        expect(mockedExecSync.mock.calls[1][0]).toContain("UserChoiceLatest");
        expect(mockedExecSync.mock.calls[2][0]).toContain("UserChoice");
        expect(result).toEqual({ isDefault: true, wasChecked: true });
    });
});

describe("setDefaultMailtoWindows", () => {
    it("opens the app-specific Default Apps page on Windows 11 22H2+ (build >= 22621)", () => {
        mockedOsRelease.mockReturnValue("10.0.22621");

        setDefaultMailtoWindows();

        expect(mockedShell.openExternal).toHaveBeenCalledWith(expect.stringContaining("ms-settings:defaultapps"));
        expect(mockedShell.openExternal).toHaveBeenCalledWith(expect.stringContaining("registeredAppUser="));

        const url = (mockedShell.openExternal as jest.Mock).mock.calls[0][0] as string;
        expect(url).toMatch(/registeredAppUser=ProtonMail$/);
    });

    it("falls back to plain ms-settings:defaultapps on Windows 11 21H2 (build < 22621)", () => {
        mockedOsRelease.mockReturnValue("10.0.22000");

        setDefaultMailtoWindows();

        const url = (mockedShell.openExternal as jest.Mock).mock.calls[0][0] as string;
        expect(url).toBe("ms-settings:defaultapps");
    });

    it("falls back to plain ms-settings:defaultapps on Windows 10 (build < 22000)", () => {
        mockedOsRelease.mockReturnValue("10.0.19044");

        setDefaultMailtoWindows();

        const url = (mockedShell.openExternal as jest.Mock).mock.calls[0][0] as string;
        expect(url).toBe("ms-settings:defaultapps");
    });
});
