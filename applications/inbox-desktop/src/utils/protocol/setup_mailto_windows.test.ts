import { EventEmitter } from "node:events";
import { resolve } from "node:path";

jest.mock("electron", () => ({
    app: {
        getPath: jest.fn().mockReturnValue("C:\\temp"),
        quit: jest.fn(),
    },
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

jest.mock("../log/quitTracker", () => ({
    quitTracker: { setReason: jest.fn() },
}));

jest.mock("node:child_process", () => ({
    spawn: jest.fn(),
}));

jest.mock("node:fs", () => ({
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
}));

import { getRegExe, registerMailtoApp } from "./setup_mailto_windows";
import { spawn } from "node:child_process";
import { readFileSync as mockReadFileSync, writeFileSync as mockWriteFileSync } from "node:fs";
import { app } from "electron";
import { quitTracker } from "../log/quitTracker";

const mockedSpawn = jest.mocked(spawn);
const mockedReadFileSync = jest.mocked(mockReadFileSync);
const mockedWriteFileSync = jest.mocked(mockWriteFileSync);
const mockedApp = app as jest.Mocked<typeof app>;
const mockedQuitTracker = quitTracker as jest.Mocked<typeof quitTracker>;

class MockChildProcess extends EventEmitter {
    stdout = new EventEmitter();
    stderr = new EventEmitter();
}

/** A template with {{TARGET_EXE}} that looks like the real .reg file structure */
const FAKE_TEMPLATE = [
    "Windows Registry Editor Version 5.00",
    "",
    "[HKEY_CURRENT_USER\\SOFTWARE\\Classes\\ProtonMail.Url.mailto]",
    '"FriendlyTypeName"="Proton Mail Url mailto"',
    '"URL Protocol"=""',
    "",
    "[HKEY_CURRENT_USER\\SOFTWARE\\Classes\\ProtonMail.Url.mailto\\shell\\open\\command]",
    '@="\\"{{TARGET_EXE}}\\" %1"',
].join("\n");

describe("getRegExe", () => {
    const originalSystemRoot = process.env.SystemRoot;

    afterEach(() => {
        if (originalSystemRoot === undefined) {
            delete process.env.SystemRoot;
        } else {
            process.env.SystemRoot = originalSystemRoot;
        }
    });

    it("returns the full path to reg.exe when SystemRoot is set", () => {
        process.env.SystemRoot = "C:\\Windows";
        expect(getRegExe()).toBe("C:\\Windows\\System32\\reg.exe");
    });

    it("falls back to bare 'reg.exe' when SystemRoot is not set", () => {
        delete process.env.SystemRoot;
        expect(getRegExe()).toBe("reg.exe");
    });
});

describe("protonmail-mailto-register.reg template content", () => {
    const templatePath = resolve(__dirname, "protonmail-mailto-register.reg");
    const { readFileSync: realReadFileSync } = jest.requireActual<typeof import("node:fs")>("node:fs");
    const content = realReadFileSync(templatePath, "utf8");

    it('has "URL Protocol"="" on the ProtonMail.Url.mailto ProgID key', () => {
        // Must appear before the first \shell subkey for ProtonMail.Url.mailto
        const progIdSection = content.split("[HKEY_CURRENT_USER\\SOFTWARE\\Classes\\ProtonMail.Url.mailto\\shell]")[0];
        expect(progIdSection).toContain('"URL Protocol"=""');
    });

    it("has ApplicationDescription in Capabilities (required for Default Apps UI)", () => {
        expect(content).toContain('"ApplicationDescription"=');
    });

    it("has ApplicationName in Capabilities", () => {
        expect(content).toContain('"ApplicationName"=');
    });

    it("registers under HKCU\\SOFTWARE\\RegisteredApplications", () => {
        expect(content).toContain("[HKEY_CURRENT_USER\\SOFTWARE\\RegisteredApplications]");
    });

    it("maps the Capabilities path under RegisteredApplications", () => {
        expect(content).toContain('"ProtonMail"="SOFTWARE\\\\Clients\\\\Mail\\\\ProtonMail\\\\Capabilities"');
    });
});

describe("registerMailtoApp", () => {
    const MOCK_RESOURCES_PATH = "/mock/resources";
    const MOCK_TEMP_PATH = "C:\\temp";
    const MOCK_EXEC_PATH = "/mock/proton_mail/app-1.8.0/Proton Mail.exe";

    let originalResourcesPath: string;
    let originalExecPath: string;

    beforeEach(() => {
        jest.clearAllMocks();

        originalResourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath ?? "";
        originalExecPath = process.execPath;

        (process as NodeJS.Process & { resourcesPath: string }).resourcesPath = MOCK_RESOURCES_PATH;
        Object.defineProperty(process, "execPath", {
            value: MOCK_EXEC_PATH,
            writable: true,
            configurable: true,
        });

        (mockedApp.getPath as jest.Mock).mockReturnValue(MOCK_TEMP_PATH);
    });

    afterEach(() => {
        (process as NodeJS.Process & { resourcesPath: string }).resourcesPath = originalResourcesPath;
        Object.defineProperty(process, "execPath", {
            value: originalExecPath,
            writable: true,
            configurable: true,
        });
    });

    describe("when createRegFile fails", () => {
        it("returns early and does not spawn reg.exe when template cannot be read", async () => {
            mockedReadFileSync.mockImplementationOnce(() => {
                throw new Error("ENOENT");
            });

            await registerMailtoApp();

            expect(mockedSpawn).not.toHaveBeenCalled();
        });

        it("returns early and does not spawn reg.exe when temp file cannot be written", async () => {
            mockedReadFileSync.mockReturnValueOnce(Buffer.from(FAKE_TEMPLATE));
            mockedWriteFileSync.mockImplementationOnce(() => {
                throw new Error("EACCES");
            });

            await registerMailtoApp();

            expect(mockedSpawn).not.toHaveBeenCalled();
        });
    });

    describe("when createRegFile succeeds", () => {
        beforeEach(() => {
            mockedReadFileSync.mockReturnValue(Buffer.from(FAKE_TEMPLATE));
            mockedWriteFileSync.mockImplementation(() => undefined);
        });

        it("writes the generated .reg file to the temp directory", async () => {
            const mockProcess = new MockChildProcess();
            mockedSpawn.mockReturnValueOnce(mockProcess as unknown as ReturnType<typeof spawn>);

            const promise = registerMailtoApp();
            mockProcess.emit("close", 0, null);
            await promise;

            expect(mockedWriteFileSync).toHaveBeenCalledWith(
                expect.stringContaining(MOCK_TEMP_PATH),
                expect.any(String),
            );
        });

        it("replaces all {{TARGET_EXE}} tokens in the generated file", async () => {
            const mockProcess = new MockChildProcess();
            mockedSpawn.mockReturnValueOnce(mockProcess as unknown as ReturnType<typeof spawn>);

            const promise = registerMailtoApp();
            mockProcess.emit("close", 0, null);
            await promise;

            const writtenContent = mockedWriteFileSync.mock.calls[0][1] as string;
            expect(writtenContent).not.toContain("{{TARGET_EXE}}");
        });

        it("spawns reg.exe with the 'import' command and the generated file path", async () => {
            const mockProcess = new MockChildProcess();
            mockedSpawn.mockReturnValueOnce(mockProcess as unknown as ReturnType<typeof spawn>);

            const promise = registerMailtoApp();
            mockProcess.emit("close", 0, null);
            await promise;

            expect(mockedSpawn).toHaveBeenCalledWith(
                expect.stringContaining("reg.exe"),
                expect.arrayContaining(["import"]),
                expect.any(Object),
            );
        });

        it("does not resolve until reg.exe process closes", async () => {
            const mockProcess = new MockChildProcess();
            mockedSpawn.mockReturnValueOnce(mockProcess as unknown as ReturnType<typeof spawn>);

            let resolved = false;
            const promise = registerMailtoApp().then(() => {
                resolved = true;
            });

            await Promise.resolve();
            await Promise.resolve();

            // Must still be pending; reg.exe has not closed yet.
            expect(resolved).toBe(false);

            mockProcess.emit("close", 0, null);
            await promise;

            expect(resolved).toBe(true);
        });

        it("calls app.quit() when reg.exe exits successfully (code 0)", async () => {
            const mockProcess = new MockChildProcess();
            mockedSpawn.mockReturnValueOnce(mockProcess as unknown as ReturnType<typeof spawn>);

            const promise = registerMailtoApp();
            mockProcess.emit("close", 0, null);
            await promise;

            expect(mockedApp.quit).toHaveBeenCalled();
        });

        it("calls app.quit() when reg.exe exits with a non-zero code", async () => {
            const mockProcess = new MockChildProcess();
            mockedSpawn.mockReturnValueOnce(mockProcess as unknown as ReturnType<typeof spawn>);

            const promise = registerMailtoApp();
            mockProcess.emit("close", 1, null);
            await promise;

            expect(mockedApp.quit).toHaveBeenCalled();
        });

        it("sets a quit reason via quitTracker when reg.exe closes", async () => {
            const mockProcess = new MockChildProcess();
            mockedSpawn.mockReturnValueOnce(mockProcess as unknown as ReturnType<typeof spawn>);

            const promise = registerMailtoApp();
            mockProcess.emit("close", 0, null);
            await promise;

            expect(mockedQuitTracker.setReason).toHaveBeenCalledWith("register-mailto-exited");
        });
    });
});
