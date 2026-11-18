import type { Mocked } from "vitest";
vi.mock("electron", () => ({
    app: {
        on: vi.fn(),
        isPackaged: false,
        getAppPath: vi.fn(() => "/mock/app"),
    },
    shell: { openExternal: vi.fn().mockResolvedValue(undefined) },
    dialog: { showMessageBox: vi.fn().mockResolvedValue({ response: 0 }) },
}));

vi.mock("../log", () => ({
    mainLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("../sentryReport");

import { dialog, shell } from "electron";

import { openExternalIPC, openExternalRedirect, openExternalWithoutSanitization } from "./openExternal";

const mockedShell = shell as Mocked<typeof shell>;
const mockedDialog = dialog as Mocked<typeof dialog>;

const ALLOWED_URL = "https://example.com/path";
const UNLISTED_PROTOCOL_URL = "magnet:?xt=urn:btih:abcdef";
const DISALLOWED_URL = "telnet://example.com";
const INVALID_URL = "not a url";

describe("openExternalIPC", () => {
    it("opens an allowed protocol", async () => {
        await openExternalIPC(ALLOWED_URL);

        expect(mockedDialog.showMessageBox).not.toHaveBeenCalled();
        expect(mockedShell.openExternal).toHaveBeenCalledWith(ALLOWED_URL);
    });

    it("silently blocks a disallowed protocol without prompting the user", async () => {
        await openExternalIPC(DISALLOWED_URL);

        expect(mockedDialog.showMessageBox).not.toHaveBeenCalled();
        expect(mockedShell.openExternal).not.toHaveBeenCalled();
    });

    it("silently blocks an unlisted protocol without prompting the user", async () => {
        await openExternalIPC(UNLISTED_PROTOCOL_URL);

        expect(mockedDialog.showMessageBox).not.toHaveBeenCalled();
        expect(mockedShell.openExternal).not.toHaveBeenCalled();
    });

    it("silently ignores a malformed URL", async () => {
        await openExternalIPC(INVALID_URL);

        expect(mockedDialog.showMessageBox).not.toHaveBeenCalled();
        expect(mockedShell.openExternal).not.toHaveBeenCalled();
    });
});

describe("openExternalRedirect", () => {
    it("opens an allowed protocol", async () => {
        await openExternalRedirect(ALLOWED_URL);

        expect(mockedShell.openExternal).toHaveBeenCalledWith(ALLOWED_URL);
    });

    it("asks user to confirm a blocked protocol", async () => {
        await openExternalRedirect(DISALLOWED_URL);

        expect(mockedDialog.showMessageBox).toHaveBeenCalled();
        expect(mockedShell.openExternal).toHaveBeenCalled();
    });

    it("prompts for an unlisted protocol", async () => {
        await openExternalRedirect(UNLISTED_PROTOCOL_URL);

        expect(mockedDialog.showMessageBox).toHaveBeenCalled();
        expect(mockedShell.openExternal).toHaveBeenCalled();
    });

    it("ignores a malformed URL without prompting the user", async () => {
        await openExternalRedirect(INVALID_URL);

        expect(mockedDialog.showMessageBox).not.toHaveBeenCalled();
        expect(mockedShell.openExternal).not.toHaveBeenCalled();
    });
});

describe("openExternalWithoutSanitization", () => {
    it("opens any protocol regardless of the allow-list", async () => {
        await openExternalWithoutSanitization(DISALLOWED_URL);

        expect(mockedDialog.showMessageBox).not.toHaveBeenCalled();
        expect(mockedShell.openExternal).toHaveBeenCalledWith(DISALLOWED_URL);
    });
});
