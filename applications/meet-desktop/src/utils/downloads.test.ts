import { EventEmitter } from "node:events";
import type { WebContents } from "electron";
import type { Mock } from "vitest";

vi.mock("electron", () => ({
    dialog: { showMessageBoxSync: vi.fn() },
}));

vi.mock("./log", () => ({
    mainLogger: { info: vi.fn(), error: vi.fn() },
}));

vi.mock("./session", () => ({
    appSession: vi.fn(),
}));

const CONTINUE_DOWNLOADING = 0;
const QUIT_ANYWAY = 1;

type SaveEvent =
    | "save starts"
    | "save ends"
    | "did-navigate"
    | "render-process-gone"
    | "destroyed"
    | "user continues downloading"
    | "user quits anyway";

const setup = async () => {
    vi.resetModules();

    const { dialog } = await import("electron");
    const showMessageBoxSync = dialog.showMessageBoxSync as Mock;
    showMessageBoxSync.mockReset();
    const { confirmQuitWithActiveDownloads, setRecordingSaveInProgress } = await import("./downloads");
    const savingPage = new EventEmitter() as unknown as WebContents;

    const apply = (event: SaveEvent) => {
        switch (event) {
            case "save starts":
                setRecordingSaveInProgress(savingPage, true);
                break;
            case "save ends":
                setRecordingSaveInProgress(savingPage, false);
                break;
            case "user continues downloading":
                showMessageBoxSync.mockReturnValueOnce(CONTINUE_DOWNLOADING);
                confirmQuitWithActiveDownloads();
                break;
            case "user quits anyway":
                showMessageBoxSync.mockReturnValueOnce(QUIT_ANYWAY);
                confirmQuitWithActiveDownloads();
                break;
            default:
                savingPage.emit(event);
        }
    };

    const quitAsks = () => {
        showMessageBoxSync.mockReset();
        showMessageBoxSync.mockReturnValue(CONTINUE_DOWNLOADING);
        const quits = confirmQuitWithActiveDownloads();
        return showMessageBoxSync.mock.calls.length === 1 && !quits;
    };

    return { apply, quitAsks, confirmQuitWithActiveDownloads, showMessageBoxSync };
};

describe("confirmQuitWithActiveDownloads", () => {
    it("quits without asking when nothing is being saved", async () => {
        const { confirmQuitWithActiveDownloads, showMessageBoxSync } = await setup();

        expect(confirmQuitWithActiveDownloads()).toBe(true);
        expect(showMessageBoxSync).not.toHaveBeenCalled();
    });

    it("quits when the user quits anyway during a recording save", async () => {
        const { apply, confirmQuitWithActiveDownloads, showMessageBoxSync } = await setup();

        apply("save starts");
        showMessageBoxSync.mockReturnValueOnce(QUIT_ANYWAY);

        expect(confirmQuitWithActiveDownloads()).toBe(true);
    });

    it.each<{ events: SaveEvent[]; asks: boolean }>([
        { events: ["save starts"], asks: true },
        { events: ["save starts", "save ends"], asks: false },
        { events: ["save starts", "save starts", "save ends"], asks: true },
        { events: ["save starts", "save starts", "save ends", "save ends"], asks: false },
        { events: ["save starts", "did-navigate"], asks: false },
        { events: ["save starts", "render-process-gone"], asks: false },
        { events: ["save starts", "destroyed"], asks: false },
        { events: ["save starts", "user continues downloading"], asks: true },
        { events: ["save starts", "user quits anyway"], asks: false },
    ])("after $events, quitting asks: $asks", async ({ events, asks }) => {
        const { apply, quitAsks } = await setup();

        events.forEach(apply);

        expect(quitAsks()).toBe(asks);
    });
});
