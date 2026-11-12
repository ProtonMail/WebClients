import { app } from "electron";
import { bringWindowToFront } from "../view/viewManagement";
import { handleSecondInstance } from "./second-instance";

jest.mock("electron", () => ({ app: { on: jest.fn() } }));
jest.mock("../log", () => ({ mainLogger: { info: jest.fn() } }));
jest.mock("../view/viewManagement", () => ({ bringWindowToFront: jest.fn() }));
jest.mock("../urls/mailtoLinks", () => ({ handleMailToUrls: jest.fn() }));
jest.mock("../protocol/deep_links", () => ({ handleOpenMail: jest.fn(), handleOpenCalendar: jest.fn() }));
jest.mock("../../ipc/notification", () => ({ cleanupDeeplinkNotifications: jest.fn() }));
jest.mock("../protocol/mailto", () => ({ getMailtoArg: jest.fn() }));
jest.mock("../downloads/downloadNotifications", () => ({ handleShowDownload: () => true }));

describe("handleSecondInstance", () => {
    it("reveals a download without raising the main window over the file manager", () => {
        handleSecondInstance();
        const [, onSecondInstance] = (app.on as jest.Mock).mock.calls[0];

        onSecondInstance({}, ["proton-inbox:show_download?downloadID=some-id"]);

        expect(bringWindowToFront).not.toHaveBeenCalled();
    });
});
