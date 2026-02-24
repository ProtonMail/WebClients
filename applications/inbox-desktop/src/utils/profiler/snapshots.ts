import os from "node:os";
import { performance } from "node:perf_hooks";
import { app } from "electron";

interface ProcessSnapshot {
    label: string;
    msSinceWindowShown: number;
    mainRssMB: number;
    mainHeapUsedMB: number;
    mainHeapTotalMB: number;
    allProcessesMB: number;
    // null at window-shown; populated on subsequent snapshots
    // designates total host CPU capacity in use over the interval
    systemCpuPct: number | null;
    electronCpuPct: number | null; // electron's CPU share; normalized across cores
}

interface SystemMemoryInfo {
    // Linux/macOS - truly unallocated pages (excluding reclaimable caches); Windows - available memory including reclaimable cached pages
    // NOTE: freeSystemPagesMB and purgeableSystemMB are unreliable indicators on macOS.
    freeSystemPagesMB: number;
    purgeableSystemMB: number | null; // macOS only; excludes inactive pages, not a full picture
    swapUsedMB: number | null; // Linux/Windows only; null on macOS
}

function getCpuTicks(): { total: number; idle: number; cpuCount: number } {
    const cpus = os.cpus();
    let total = 0;
    let idle = 0;
    for (const cpu of cpus) {
        for (const val of Object.values(cpu.times)) {
            total += val as number;
        }
        idle += cpu.times.idle;
    }
    return { total, idle, cpuCount: cpus.length };
}

export class SnapshotRecorder {
    private processSnapshots: ProcessSnapshot[] = [];
    private systemMemoryAtWindowShown: SystemMemoryInfo | null = null;
    private prevState: {
        cpuTicks: { total: number; idle: number; cpuCount: number };
        electronCpuSecs: number;
        captureTimeMs: number;
    } | null = null;

    public captureSystemMemory(): void {
        const sysInfo = process.getSystemMemoryInfo() as {
            free: number;
            swapTotal?: number;
            swapFree?: number;
            purgeable?: number;
        };
        const swapUsedMB =
            sysInfo.swapTotal != null && sysInfo.swapTotal > 0
                ? Math.round((sysInfo.swapTotal - (sysInfo.swapFree ?? 0)) / 1024)
                : null;
        this.systemMemoryAtWindowShown = {
            freeSystemPagesMB: Math.round(sysInfo.free / 1024),
            purgeableSystemMB: sysInfo.purgeable !== undefined ? Math.round(sysInfo.purgeable / 1024) : null,
            swapUsedMB,
        };
    }

    public captureProcessSnapshot(label: string, iifeStart: number, windowShownMs: number): void {
        const now = performance.now();
        const mem = process.memoryUsage();
        const metrics = app.getAppMetrics();
        const totalKB = metrics.reduce((sum, m) => sum + m.memory.workingSetSize, 0);
        const currentTicks = getCpuTicks();

        // cumulativeCPUUsage is total CPU seconds consumed by the process since start (Electron >= v29).
        const currentElectronCpuSecs = metrics.reduce((sum, m) => sum + (m.cpu.cumulativeCPUUsage ?? 0), 0);

        let systemCpuPct: number | null = null;
        let electronCpuPct: number | null = null;

        if (this.prevState !== null) {
            const totalDelta = currentTicks.total - this.prevState.cpuTicks.total;
            const idleDelta = currentTicks.idle - this.prevState.cpuTicks.idle;
            systemCpuPct = totalDelta > 0 ? Math.round((1 - idleDelta / totalDelta) * 1000) / 10 : null;

            const electronCpuDeltaSecs = currentElectronCpuSecs - this.prevState.electronCpuSecs;
            const wallClockDeltaSecs = (now - this.prevState.captureTimeMs) / 1000;
            electronCpuPct =
                wallClockDeltaSecs > 0
                    ? Math.round((electronCpuDeltaSecs / wallClockDeltaSecs / currentTicks.cpuCount) * 1000) / 10
                    : null;
        }
        this.prevState = { cpuTicks: currentTicks, electronCpuSecs: currentElectronCpuSecs, captureTimeMs: now };

        this.processSnapshots.push({
            label,
            msSinceWindowShown: Math.round(now - iifeStart - windowShownMs),
            mainRssMB: Math.round(mem.rss / 1024 / 1024),
            mainHeapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
            mainHeapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
            allProcessesMB: Math.round(totalKB / 1024),
            systemCpuPct,
            electronCpuPct,
        });
    }

    public buildSystemResourceUsage() {
        if (this.processSnapshots.length === 0) return null;
        return {
            memory: this.systemMemoryAtWindowShown,
            snapshots: [...this.processSnapshots],
        };
    }
}
