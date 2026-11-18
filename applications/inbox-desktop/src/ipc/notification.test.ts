import type { Mock } from "vitest";
import type { ElectronNotification } from "@proton/shared/lib/desktop/desktopTypes";
import { Notification } from "electron";
import { notificationLogger } from "../utils/log";
import { showNotification, windowsToastNotification } from "./notification";

const mockedNotification = Notification as unknown as Mock;
const mockedError = notificationLogger.error as Mock;

const { mockShow, mockOn } = vi.hoisted(() => ({ mockShow: vi.fn(), mockOn: vi.fn() }));

vi.mock("electron", () => ({
    Notification: vi.fn(function () {
        return { on: mockOn, show: mockShow };
    }),
    app: { on: vi.fn() },
    nativeImage: { createFromDataURL: vi.fn() },
    WebContentsView: vi.fn(),
}));

vi.mock("../utils/view/viewManagement", () => ({
    bringWindowToFront: vi.fn(),
    openCalendarWithoutReload: vi.fn(),
    getCurrentLocalID: vi.fn(() => "local-1"),
    openMail: vi.fn(),
}));

vi.mock("../utils/view/viewState", () => ({
    getMainWindow: vi.fn(),
}));

vi.mock("../utils/view/windowUtils", () => ({
    isWindowValid: vi.fn(() => true),
}));

vi.mock("../utils/log", () => ({
    ipcLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
    notificationLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("../utils/helpers", async (importOriginal) => ({
    ...(await importOriginal<typeof import("../utils/helpers")>()),
    isWindows: true,
    isMac: false,
}));

vi.mock("../constants/resources", () => ({ getFileResourcePath: vi.fn(() => "/tmp/blank.html") }));

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
        vi.clearAllMocks();
    });

    it("shows a notification for a valid payload", () => {
        showNotification(baseMailPayload);

        expect(mockedNotification).toHaveBeenCalledTimes(1);
        expect(mockShow).toHaveBeenCalledTimes(1);
    });

    it("strips bidi control characters before showing the notification", () => {
        showNotification({ ...baseMailPayload, body: "From: Bob\u202E - Invoice txt.exe" });

        const { toastXml } = mockedNotification.mock.calls[0][0];
        expect(toastXml).toContain("From: Bob - Invoice txt.exe");
        expect(toastXml).not.toContain("\u202E");
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
