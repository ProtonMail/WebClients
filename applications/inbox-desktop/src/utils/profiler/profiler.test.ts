import { describe, it, expect, beforeEach, jest } from "@jest/globals";

jest.mock("node:perf_hooks", () => ({
    performance: { now: jest.fn() },
    monitorEventLoopDelay: jest.fn(() => ({
        enable: jest.fn(),
        disable: jest.fn(),
        percentile: jest.fn(() => 0),
        max: 0,
    })),
}));

jest.mock("../../store/settingsStore", () => ({
    getSettings: jest.fn(),
}));

jest.mock("../log", () => ({
    profilerLogger: { info: jest.fn(), error: jest.fn() },
}));

jest.mock("./snapshots", () => ({
    SnapshotRecorder: jest.fn().mockImplementation(() => ({
        captureSystemMemory: jest.fn(),
        captureProcessSnapshot: jest.fn(),
        buildSystemResourceUsage: jest.fn(),
    })),
}));

jest.mock("./ipc", () => ({
    IpcRecorder: jest.fn().mockImplementation(() => ({
        ipcMessage: jest.fn(),
        closeIpcWindow: jest.fn(),
        build: jest.fn(),
    })),
}));

const mockMainFrameFirstByteMs = new Map<string, number>();
jest.mock("./startupRequests", () => ({
    StartupRequestRecorder: jest.fn().mockImplementation(() => ({
        closeResourceWindow: jest.fn(),
        mainFrameFirstByteMs: mockMainFrameFirstByteMs,
        buildResources: jest.fn(),
        cleanup: jest.fn(),
    })),
}));

import { performance } from "node:perf_hooks";
import { getSettings } from "../../store/settingsStore";
import { profiler, profilerTestOnly } from "./profiler";
import { SnapshotRecorder } from "./snapshots";
import { IpcRecorder } from "./ipc";

const MockSnapshotRecorder = SnapshotRecorder as jest.MockedClass<typeof SnapshotRecorder>;
const MockIpcRecorder = IpcRecorder as jest.MockedClass<typeof IpcRecorder>;

const mockPerfNow = performance.now as jest.Mock;
const mockGetSettings = getSettings as jest.Mock;

describe("profiler — buildStartup", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPerfNow.mockReset();
        mockGetSettings.mockReturnValue({ profilingEnabled: true, profilingMode: "warm" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (process as any).getCreationTime = jest.fn().mockReturnValue(null);
        mockMainFrameFirstByteMs.clear();
        profilerTestOnly.resetAll();
        profiler.init(Date.now(), 0);
    });

    it("reports all 12 phases correctly when every mark and the mail first byte are present", () => {
        // Re-init so getCreationTime → forkToIife = 100ms (process started 100ms before IIFE)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (process as any).getCreationTime = jest.fn().mockReturnValue(Date.now() - 100);
        profiler.init(Date.now(), 0);

        mockPerfNow.mockReturnValueOnce(100);
        profiler.mark("sentry-done"); // iife-start-to-sentry-done = 100ms

        mockPerfNow.mockReturnValueOnce(105);
        profiler.mark("squirrel-done"); // sentry-done-to-squirrel-done = 105 - 100 = 5ms

        mockPerfNow.mockReturnValueOnce(110);
        profiler.mark("migrations-done"); // squirrel-done-to-migrations-done = 110 - 105 = 5ms

        mockPerfNow.mockReturnValueOnce(500);
        profiler.mark("app-ready"); // migrations-done-to-app-ready = 500 - 110 = 390ms

        mockPerfNow.mockReturnValueOnce(520);
        profiler.mark("pre-view-creation"); // app-ready-to-pre-view-creation = 520 - 500 = 20ms

        mockPerfNow.mockReturnValueOnce(570);
        profiler.mark("window-created"); // pre-view-creation-to-window-created = 570 - 520 = 50ms

        mockPerfNow.mockReturnValueOnce(590);
        profiler.mark("views-created"); // window-created-to-views-created = 590 - 570 = 20ms

        mockPerfNow.mockReturnValueOnce(600);
        profiler.mark("load-url-called"); // views-created-to-load-url-called = 600 - 590 = 10ms

        mockMainFrameFirstByteMs.set("mail", 820); // load-url-called-to-first-byte = 820 - 600 = 220ms

        mockPerfNow.mockReturnValueOnce(1500);
        profiler.mark("did-finish-load"); // first-byte-to-did-finish-load = 1500 - 820 = 680ms

        mockPerfNow.mockReturnValueOnce(1550);
        profiler.mark("window-shown"); // did-finish-load-to-window-shown = 1550 - 1500 = 50ms

        const result = profilerTestOnly.buildStartup();
        const phase = (name: string) => result.phases.find((p) => p.name === name)?.ms;

        expect(phase("fork-to-iife-start")).toBe(100);
        expect(phase("iife-start-to-sentry-done")).toBe(100);
        expect(phase("sentry-done-to-squirrel-done")).toBe(5);
        expect(phase("squirrel-done-to-migrations-done")).toBe(5);
        expect(phase("migrations-done-to-app-ready")).toBe(390);
        expect(phase("app-ready-to-pre-view-creation")).toBe(20);
        expect(phase("pre-view-creation-to-window-created")).toBe(50);
        expect(phase("window-created-to-views-created")).toBe(20);
        expect(phase("views-created-to-load-url-called")).toBe(10);
        expect(phase("load-url-called-to-first-byte")).toBe(220);
        expect(phase("first-byte-to-did-finish-load")).toBe(680);
        expect(phase("did-finish-load-to-window-shown")).toBe(50);

        const expectedTotal = 100 + 100 + 5 + 5 + 390 + 20 + 50 + 20 + 10 + 220 + 680 + 50;
        expect(result.complete).toBe(true);
        expect(result.totalMs).toBe(expectedTotal);
        expect(result.measuredMs).toBe(expectedTotal);
    });

    it("is incomplete and totalMs is null when forkToIife is missing", () => {
        mockPerfNow.mockReturnValueOnce(100); // 100
        profiler.mark("sentry-done");
        mockPerfNow.mockReturnValueOnce(105); // 105 - 100 = 5
        profiler.mark("squirrel-done");
        mockPerfNow.mockReturnValueOnce(110); // 110 - 105 = 5
        profiler.mark("migrations-done");
        mockPerfNow.mockReturnValueOnce(500); // 500 - 110 = 390
        profiler.mark("app-ready");
        mockPerfNow.mockReturnValueOnce(520); // 520 - 500 = 20
        profiler.mark("pre-view-creation");
        mockPerfNow.mockReturnValueOnce(570); // 570 - 520 = 50
        profiler.mark("window-created");
        mockPerfNow.mockReturnValueOnce(590); // 590 - 570 = 20
        profiler.mark("views-created");
        mockPerfNow.mockReturnValueOnce(600); // 600 - 590 = 10
        profiler.mark("load-url-called");
        mockMainFrameFirstByteMs.set("mail", 820); // 820 - 600 = 220
        mockPerfNow.mockReturnValueOnce(1500); // 1500 - 820 = 680
        profiler.mark("did-finish-load");
        mockPerfNow.mockReturnValueOnce(1550); // 1550 - 1500 = 50
        profiler.mark("window-shown");

        const result = profilerTestOnly.buildStartup();
        expect(result.complete).toBe(false);
        expect(result.totalMs).toBeNull();

        // fork-to-iife-start is null since getCreationTime mock is set to null;
        expect(result.phases.find((p) => p.name === "fork-to-iife-start")?.ms).toBeNull();
        expect(result.phases.find((p) => p.name === "iife-start-to-sentry-done")?.ms).toBe(100);

        expect(result.measuredMs).toBe(100 + 5 + 5 + 390 + 20 + 50 + 20 + 10 + 220 + 680 + 50);
    });

    it("mark() is a no-op before init is called", () => {
        profilerTestOnly.resetAll();

        // mark while disabled; performance.now() shouldn't be consumed
        mockPerfNow.mockReturnValueOnce(250);
        profiler.mark("sentry-done");

        profiler.init(Date.now(), 0); // re-enable
        mockPerfNow.mockReturnValueOnce(400);
        profiler.mark("sentry-done"); // should consume old performance.now() value (250)

        const result = profilerTestOnly.buildStartup();
        const phase = result.phases.find((p) => p.name === "iife-start-to-sentry-done");
        expect(phase?.ms).toBe(250);
    });

    it("viewFirstByteMs contains recorded views and null for unrecorded ones", () => {
        mockPerfNow.mockReturnValueOnce(0);
        profiler.mark("load-url-called"); // creates StartupRequestRecorder with mockMainFrameFirstByteMs
        mockMainFrameFirstByteMs.set("mail", 820);
        mockMainFrameFirstByteMs.set("calendar", 900);

        const result = profilerTestOnly.buildStartup();
        expect(result.viewFirstByteMs.mail).toBe(820);
        expect(result.viewFirstByteMs.calendar).toBe(900);
        expect(result.viewFirstByteMs.account).toBeNull();
    });

    it("ignores duplicate mark calls, only first timing is recorded", () => {
        mockPerfNow
            .mockReturnValueOnce(50) // migrations-done
            .mockReturnValueOnce(200) // app-ready
            .mockReturnValueOnce(999); // app-ready

        profiler.mark("migrations-done");
        profiler.mark("app-ready");
        profiler.mark("app-ready");

        const result = profilerTestOnly.buildStartup();
        const phaseOne = result.phases.find((p) => p.name === "squirrel-done-to-migrations-done");
        expect(phaseOne?.ms).toBe(null); // the previous mark is null, the phase delta will be null

        const phase = result.phases.find((p) => p.name === "migrations-done-to-app-ready");
        expect(phase?.ms).toBe(150); // 200 - 50
    });
});

describe("profiler — mark() side effects", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPerfNow.mockReset();
        mockGetSettings.mockReturnValue({ profilingEnabled: true, profilingMode: "warm" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (process as any).getCreationTime = jest.fn().mockReturnValue(null);
        mockMainFrameFirstByteMs.clear();
        profilerTestOnly.resetAll();
        profiler.init(Date.now(), 0);
    });

    it('mark("window-shown") captures memory, a process snapshot, and constructs the IpcRecorder', () => {
        mockPerfNow.mockReturnValueOnce(1550);
        profiler.mark("window-shown");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const snapshotsInstance = MockSnapshotRecorder.mock.results[0].value as any;
        expect(snapshotsInstance.captureSystemMemory).toHaveBeenCalledTimes(1);
        expect(snapshotsInstance.captureProcessSnapshot).toHaveBeenCalledWith("window-shown", 0, 1550);
        expect(MockIpcRecorder).toHaveBeenCalledWith(1550, 0);
    });
});
