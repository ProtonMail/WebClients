import type { ElectronNotification } from "@proton/shared/lib/desktop/desktopTypes";
import { Notification } from "electron";
import { notificationLogger } from "../utils/log";
import { showNotification, windowsToastNotification } from "./notification";

const mockedNotification = Notification as unknown as jest.Mock;
const mockedError = notificationLogger.error as jest.Mock;

const mockShow = jest.fn();
const mockOn = jest.fn();

jest.mock("electron", () => ({
    Notification: jest.fn().mockImplementation(() => ({ on: mockOn, show: mockShow })),
    app: { on: jest.fn() },
    nativeImage: { createFromDataURL: jest.fn() },
    WebContentsView: jest.fn(),
}));

jest.mock("../utils/view/viewManagement", () => ({
    bringWindowToFront: jest.fn(),
    openCalendarWithoutReload: jest.fn(),
    getMainWindow: jest.fn(),
    getCurrentLocalID: jest.fn(() => "local-1"),
    openMail: jest.fn(),
}));

jest.mock("../utils/view/windowUtils", () => ({
    isWindowValid: jest.fn(() => true),
}));

jest.mock("../utils/log", () => ({
    ipcLogger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
    notificationLogger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock("../utils/helpers", () => ({
    ...jest.requireActual("../utils/helpers"),
    isWindows: true,
    isMac: false,
}));

jest.mock("../constants/resources", () => ({ getFileResourcePath: jest.fn(() => "/tmp/blank.html") }));

const baseMailPayload: ElectronNotification = {
    title: "New email received",
    body: "From: Alice - Lunch?",
    app: "mail",
    labelID: "0",
    elementID: "element-1",
    messageID: "message-1",
};

describe("windowsToastNotification", () => {
    it("interpolates benign title and body into the text elements", () => {
        const { toastXml } = windowsToastNotification(baseMailPayload, "uuid-1", "local-1");

        expect(toastXml).toContain(`<text id="1">New email received</text>`);
        expect(toastXml).toContain(`<text id="2">From: Alice - Lunch?</text>`);
    });

    it("escapes a markup injection payload in the body instead of emitting raw tags", () => {
        const malicious = `</text><actions><action content="pwn" arguments="evil:uri" activationType="protocol"/></actions><text>`;
        const { toastXml } = windowsToastNotification({ ...baseMailPayload, body: malicious }, "uuid-1", "local-1");

        expect(toastXml).not.toContain("<actions>");
        expect(toastXml).not.toContain("<action ");
        expect(toastXml).toContain("&lt;actions&gt;");
    });

    it("escapes the ampersand separators in the launch attribute", () => {
        const { toastXml } = windowsToastNotification(baseMailPayload, "uuid-1", "local-1");

        const launch = toastXml.match(/launch="([^"]*)"/)?.[1];
        expect(launch).toBeDefined();
        expect(launch).toContain("&amp;");
        expect(launch).not.toMatch(/&(?!amp;)/);
    });
});

describe("showNotification", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("shows a notification for a valid payload", () => {
        showNotification(baseMailPayload);

        expect(mockedNotification).toHaveBeenCalledTimes(1);
        expect(mockShow).toHaveBeenCalledTimes(1);
    });

    it("rejects a payload with an unknown app without building a toast", () => {
        showNotification({ ...baseMailPayload, app: "drive" as ElectronNotification["app"] });

        expect(mockedNotification).not.toHaveBeenCalled();
        expect(mockShow).not.toHaveBeenCalled();
        expect(mockedError).toHaveBeenCalled();
    });

    it("rejects a payload with unexpected extra keys", () => {
        showNotification({ ...baseMailPayload, injected: "<toast/>" } as ElectronNotification);

        expect(mockedNotification).not.toHaveBeenCalled();
        expect(mockShow).not.toHaveBeenCalled();
        expect(mockedError).toHaveBeenCalled();
    });
});
