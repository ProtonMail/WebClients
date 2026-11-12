import { app, Notification, shell } from "electron";
import { handleDownloads, handleShowDownload } from "./downloadNotifications";

let mockIsWindows = false;
let mockFlagEnabled = true;
const mockSessionOn = jest.fn();

jest.mock("electron", () => ({
    app: { on: jest.fn(), dock: { downloadFinished: jest.fn() } },
    Notification: jest.fn().mockImplementation(() => ({ on: jest.fn(), show: jest.fn() })),
    shell: { showItemInFolder: jest.fn() },
}));

jest.mock("../electronSession/partitions", () => ({ appSession: () => ({ on: mockSessionOn }) }));

jest.mock("../flags/manager", () => ({
    getFeatureFlagManager: () => ({ isEnabled: () => mockFlagEnabled }),
}));

jest.mock("../helpers", () => ({
    ...jest.requireActual("../helpers"),
    get isWindows() {
        return mockIsWindows;
    },
}));

jest.mock("../log", () => ({
    notificationLogger: { info: jest.fn(), warn: jest.fn() },
    protocolLogger: { log: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

jest.mock("../view/viewManagement", () => ({}));

jest.mock("../../ipc/notification", () => ({
    buildProtocolToast: (launch: string, title: string, body: string) => ({ toastXml: `${launch}|${title}|${body}` }),
}));

const mockedNotification = Notification as unknown as jest.Mock;
const SAVE_PATH = "/Users/someone/Downloads/report.pdf";

const finishDownload = (state: "completed" | "cancelled" | "interrupted", savePath = SAVE_PATH) => {
    handleDownloads();
    const [, onWillDownload] = mockSessionOn.mock.calls.at(-1);
    const item = { getSavePath: () => savePath, getFilename: () => "original.pdf", once: jest.fn() };
    onWillDownload({}, item);
    const [, onDone] = item.once.mock.calls[0];
    onDone({}, state);
};

const lastNotification = () => mockedNotification.mock.results.at(-1)!.value;

const clickLastNotification = () => {
    const [, onClick] = lastNotification().on.mock.calls.find(([event]: [string]) => event === "click");
    onClick();
};

describe("download notifications", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsWindows = false;
        mockFlagEnabled = true;
    });

    it("does nothing when the feature flag is off", () => {
        mockFlagEnabled = false;
        finishDownload("completed");

        expect(mockedNotification).not.toHaveBeenCalled();
        expect(app.dock!.downloadFinished).not.toHaveBeenCalled();
    });

    it("shows a completed notification that reveals the saved file on click", () => {
        finishDownload("completed");

        expect(mockedNotification).toHaveBeenCalledWith({ title: "Download complete", body: "report.pdf" });
        expect(lastNotification().show).toHaveBeenCalled();
        expect(app.dock!.downloadFinished).toHaveBeenCalledWith(SAVE_PATH);

        clickLastNotification();
        expect(shell.showItemInFolder).toHaveBeenCalledWith(SAVE_PATH);
    });

    it("shows a failed notification without bouncing the dock when the download is interrupted", () => {
        finishDownload("interrupted");

        expect(mockedNotification).toHaveBeenCalledWith({ title: "Download failed", body: "report.pdf" });
        expect(app.dock!.downloadFinished).not.toHaveBeenCalled();
    });

    it("falls back to the original filename when the download fails before a save path is chosen", () => {
        finishDownload("interrupted", "");

        expect(mockedNotification).toHaveBeenCalledWith({ title: "Download failed", body: "original.pdf" });
    });

    it("shows nothing when the save dialog is cancelled", () => {
        finishDownload("cancelled");

        expect(mockedNotification).not.toHaveBeenCalled();
    });

    describe("on Windows", () => {
        beforeEach(() => {
            mockIsWindows = true;
        });

        const getToastLaunch = () => {
            const [{ toastXml }] = mockedNotification.mock.calls.at(-1);
            return toastXml.split("|")[0] as string;
        };

        it("links the toast to an opaque download ID instead of the file path", () => {
            finishDownload("completed");

            const launch = getToastLaunch();
            expect(launch).toMatch(/^proton-inbox:show_download\?downloadID=[0-9a-f-]{36}$/);
            expect(launch).not.toContain("report.pdf");
        });

        it("reveals the file through the deep link only once", () => {
            finishDownload("completed");
            const launch = getToastLaunch();

            expect(handleShowDownload([launch])).toBe(true);
            expect(shell.showItemInFolder).toHaveBeenCalledWith(SAVE_PATH);

            expect(handleShowDownload([launch])).toBe(true);
            expect(shell.showItemInFolder).toHaveBeenCalledTimes(1);
        });
    });

    describe("handleShowDownload", () => {
        it("ignores unknown download IDs and path parameters", () => {
            expect(handleShowDownload(["proton-inbox:show_download?downloadID=unknown&path=/etc/passwd"])).toBe(true);
            expect(shell.showItemInFolder).not.toHaveBeenCalled();
        });

        it("does not handle other deep links", () => {
            expect(handleShowDownload(["proton-inbox:open_calendar"])).toBe(false);
        });
    });
});
