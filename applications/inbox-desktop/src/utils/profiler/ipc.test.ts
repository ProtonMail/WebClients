import { describe, it, expect, beforeEach, jest } from "@jest/globals";

jest.mock("node:perf_hooks", () => ({
    performance: { now: jest.fn() },
}));

import { performance } from "node:perf_hooks";
import { IpcRecorder } from "./ipc";

const mockPerfNow = performance.now as jest.Mock;

describe("IpcRecorder", () => {
    beforeEach(() => {
        mockPerfNow.mockReset();
        mockPerfNow.mockReturnValue(0);
    });

    describe("build", () => {
        it("does not record messages when the window is closed", () => {
            const ipc = new IpcRecorder(0, 0);
            ipc.closeIpcWindow();
            ipc.ipcMessage("getInfo", "theme", 10);
            expect(ipc.build().messageCount).toBe(0);
        });

        it("records messages only while the window is open", () => {
            const ipc = new IpcRecorder(0, 0);
            ipc.ipcMessage("getInfo", "theme", 1);
            ipc.ipcMessage("getInfo", "theme", 1);
            ipc.ipcMessage("getInfo", "theme", 1);

            ipc.closeIpcWindow();
            ipc.ipcMessage("getInfo", "theme", 1);
            ipc.ipcMessage("getInfo", "theme", 1);
            ipc.ipcMessage("getInfo", "theme", 1);

            expect(ipc.build().messageCount).toBe(3);
        });

        it("arrivedMs correctly subtracts iifeStart and windowShownMs from performance.now()", () => {
            // iifeStart=100, windowShownMs=500 -> arrivedMS = 800 - 100 - 500 = 200
            const ipc = new IpcRecorder(500, 100);
            mockPerfNow.mockReturnValue(800);
            ipc.ipcMessage("getInfo", "theme", 1);

            mockPerfNow.mockReturnValue(900);
            ipc.ipcMessage("getInfo", "theme", 1);

            const result = ipc.build();
            expect(result.firstMessageMs).toBe(200);
            expect(result.lastMessageMs).toBe(300);
            expect(result.messageCount).toBe(2);
        });

        it("includes handlers at exactly the 5ms threshold in slowHandlers", () => {
            const ipc = new IpcRecorder(0, 0);
            ipc.ipcMessage("getInfo", "slow", 5);
            ipc.ipcMessage("getInfo", "fast", 4.99);

            const { slowHandlers } = ipc.build();
            expect(slowHandlers).toHaveLength(1);
            expect(slowHandlers[0]).toMatchObject({ type: "slow", handlerMs: 5 });
        });
    });

    describe("closeIpcWindow", () => {
        it("stops recording messages after window is closed", () => {
            const ipc = new IpcRecorder(0, 0);
            ipc.ipcMessage("getInfo", "theme", 10);
            ipc.closeIpcWindow();

            ipc.ipcMessage("getInfo", "theme", 10);
            ipc.ipcMessage("getInfo", "theme", 10);
            ipc.ipcMessage("getInfo", "theme", 10);

            expect(ipc.build().messageCount).toBe(1);
        });
    });
});
