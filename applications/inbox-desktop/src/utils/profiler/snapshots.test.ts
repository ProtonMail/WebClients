import { describe, it, expect, beforeEach, jest } from "@jest/globals";

jest.mock("node:perf_hooks", () => ({
    performance: { now: jest.fn() },
}));

jest.mock("node:os", () => ({
    cpus: jest.fn(),
}));

jest.mock("electron", () => ({
    app: {
        getAppMetrics: jest.fn(),
    },
}));

import { performance } from "node:perf_hooks";
import os from "node:os";
import { app } from "electron";
import { SnapshotRecorder } from "./snapshots";

const mockPerfNow = performance.now as jest.Mock;
const mockCpus = os.cpus as jest.Mock;
const mockGetAppMetrics = app.getAppMetrics as jest.Mock;

function makeCpu(user: number, sys: number, idle: number) {
    return { model: "Test CPU", speed: 3000, times: { user, nice: 0, sys, idle, irq: 0 } };
}

describe("SnapshotRecorder", () => {
    let snapshots: SnapshotRecorder;

    beforeEach(() => {
        mockPerfNow.mockReset();
        mockCpus.mockReset();
        mockGetAppMetrics.mockReset();
        snapshots = new SnapshotRecorder();
    });

    describe("buildSystemResourceUsage", () => {
        it("returns null when no snapshots have been taken", () => {
            expect(snapshots.buildSystemResourceUsage()).toBeNull();
        });
    });

    describe("captureProcessSnapshot — CPU delta", () => {
        it("computes CPU deltas independently per interval across multiple snapshots", () => {
            // OS ticks
            // s1 ticks; total=1000, idle=1000, no ref -> 0% usage
            // s2 ticks; total=1200, idle=1150 -> delta_total = 200, delta_idle = 150, 150/250 = 25% usage
            // s3 ticks; total=1400, idle=1250 -> delta_total = 200, delta_idle = 100, 100/200 = 50% usage
            // 2 cores with same values
            mockCpus
                .mockReturnValueOnce([makeCpu(0, 0, 1000), makeCpu(0, 0, 1000)]) // s1
                .mockReturnValueOnce([makeCpu(50, 0, 1150), makeCpu(50, 0, 1150)]) // s2
                .mockReturnValueOnce([makeCpu(150, 0, 1250), makeCpu(150, 0, 1250)]); // s3

            mockPerfNow.mockReturnValueOnce(0).mockReturnValueOnce(1000).mockReturnValueOnce(3000);

            // Electron ticks
            // cumulativeCPUUsage is raw CPU seconds across all threads
            // electronCpuPct = cumulativeCPUUSage_delta / wallClockSecs / cpuCount * 100
            // s2: 0.1s / 1.0s / 2 -> 5%
            // s3: 0.5s / 2.0s / 2 -> 12.5%
            mockGetAppMetrics
                .mockReturnValueOnce([{ memory: { workingSetSize: 0 }, cpu: { cumulativeCPUUsage: 0.0 } }])
                .mockReturnValueOnce([{ memory: { workingSetSize: 0 }, cpu: { cumulativeCPUUsage: 0.1 } }])
                .mockReturnValueOnce([{ memory: { workingSetSize: 0 }, cpu: { cumulativeCPUUsage: 0.6 } }]);

            snapshots.captureProcessSnapshot("window-shown", 0, 0);
            snapshots.captureProcessSnapshot("report-start", 0, 0);
            snapshots.captureProcessSnapshot("report-midpoint", 0, 0);

            const result = snapshots.buildSystemResourceUsage()!;
            expect(result.snapshots[0].systemCpuPct).toBeNull();
            expect(result.snapshots[0].electronCpuPct).toBeNull();
            expect(result.snapshots[1].systemCpuPct).toBe(25);
            expect(result.snapshots[1].electronCpuPct).toBe(5);
            expect(result.snapshots[2].systemCpuPct).toBe(50);
            expect(result.snapshots[2].electronCpuPct).toBe(12.5);
        });

        it("aggregates CPU ticks correctly across cores with asymmetric load", () => {
            // Delta CPU1: 1600-1000, fully on sys = 100% usage
            // Delta CPU2: 1600-1000, 600 - 300 = idle usage = 50% usage
            // cumulative 75% usage
            mockCpus
                .mockReturnValueOnce([makeCpu(0, 0, 1000), makeCpu(0, 0, 1000)]) // s1
                .mockReturnValueOnce([makeCpu(600, 0, 1000), makeCpu(300, 0, 1300)]); // s2

            mockPerfNow.mockReturnValueOnce(0).mockReturnValueOnce(2000);

            // 0.3s / 2s / cores = 7.5%
            mockGetAppMetrics
                .mockReturnValueOnce([{ memory: { workingSetSize: 0 }, cpu: { cumulativeCPUUsage: 0.0 } }])
                .mockReturnValueOnce([{ memory: { workingSetSize: 0 }, cpu: { cumulativeCPUUsage: 0.3 } }]);

            snapshots.captureProcessSnapshot("window-shown", 0, 0);
            snapshots.captureProcessSnapshot("report-start", 0, 0);

            const result = snapshots.buildSystemResourceUsage()!;
            expect(result.snapshots[0].systemCpuPct).toBeNull();
            expect(result.snapshots[1].systemCpuPct).toBe(75);
            expect(result.snapshots[1].electronCpuPct).toBe(7.5);
        });
    });
});
