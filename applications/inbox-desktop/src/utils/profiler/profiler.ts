import path from "node:path";
import fs from "node:fs";
import { app, Notification, session as electronSession } from "electron";
import { monitorEventLoopDelay, performance } from "node:perf_hooks";
import { getSettings, updateSettings } from "../../store/settingsStore";
import { getAppURL } from "../../store/urlStore";
import { profilerLogger } from "../log";
import { buildNetworkProbe } from "./network";
import { buildSystem, buildGPU, buildContext } from "./system";
import { snapshots } from "./snapshots";
import { ipc } from "./ipc";
import { resources } from "./resources";

// Core profiler timing state
let enabled = false;
let writing = false;
let iifeStartPerf = 0; // performance.now() — used for all other timing
let forkToIife: number | null = null;
let profilingMode: "warm" | "cold" = "warm";
const marks = new Map<string, number>();

// Event loop
let eventLoopMonitor: ReturnType<typeof monitorEventLoopDelay> | null = null;

function init(iifeStartMs: number, iifeStartPerfMeasured: number): void {
    const settings = getSettings();
    if (!settings.profilingEnabled) return;

    enabled = true;
    iifeStartPerf = iifeStartPerfMeasured;
    profilingMode = settings.profilingMode ?? "warm";

    // Get process creation time from the OS, from fork() on Unix. Must use unix timestamps.
    const creationTime = process.getCreationTime();
    forkToIife = creationTime !== null ? iifeStartMs - creationTime : null;

    profilerLogger.info(`Profiler started, mode: ${profilingMode}`);
}

function mark(name: string): void {
    if (!enabled) return;
    if (marks.has(name)) return; // only record first call

    marks.set(name, performance.now() - iifeStartPerf);

    switch (name) {
        case "app-ready":
            eventLoopMonitor = monitorEventLoopDelay({ resolution: 20 });
            eventLoopMonitor.enable();
            break;

        case "load-url-called":
            resources.openResourceWindow();
            break;

        case "did-finish-load":
            resources.closeResourceWindow();
            break;

        case "window-shown": {
            const windowShownMs = marks.get("window-shown") ?? 0;
            snapshots.captureSystemMemory();
            snapshots.captureProcessSnapshot("window-shown", iifeStartPerf, windowShownMs);
            eventLoopMonitor?.disable();
            ipc.openIpcWindow(windowShownMs, iifeStartPerf);
            break;
        }
    }
}

function hookRequestTiming(session: Electron.Session): void {
    if (!enabled) return;
    resources.hookRequestTiming(session, iifeStartPerf);
}

function ipcMessage(channel: string, type: string, handlerMs: number): void {
    if (!enabled) return;
    ipc.ipcMessage(channel, type, handlerMs);
}

async function writeReport(): Promise<void> {
    if (!enabled || writing) return;
    writing = true;

    profilerLogger.info("Writing performance report...");

    try {
        const windowShownMs = marks.get("window-shown") ?? 0;

        // Collect IPC messages and process snapshots over 10s
        snapshots.captureProcessSnapshot("report-start", iifeStartPerf, windowShownMs);
        await new Promise<void>((resolve) => setTimeout(resolve, 5_000));

        snapshots.captureProcessSnapshot("report-midpoint", iifeStartPerf, windowShownMs);
        await new Promise<void>((resolve) => setTimeout(resolve, 5_000));

        snapshots.captureProcessSnapshot("report-end", iifeStartPerf, windowShownMs);
        ipc.closeIpcWindow();

        // Disable early so mark/ipcMessage/hookRequestTiming become no-ops during report generation.
        // resetAll() in finally also clears this, but the early disable is intentional.
        enabled = false;
        updateSettings({ profilingEnabled: false, profilingMode: undefined });

        // Network probes run after observation window so they don't compete with renderer network activity.
        // Adds about ~1-5s typically, and up to ~9s in the worst case to the report generation time.
        const networkProbePromise = buildNetworkProbe();

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `proton-mail-profile-${timestamp}.json`;
        const outputPath = path.join(app.getPath("logs"), filename);

        const [proxyConfig, networkProbe] = await Promise.all([
            electronSession.defaultSession.resolveProxy(getAppURL().mail).catch(() => "unknown"),
            networkProbePromise,
        ]);

        const report = {
            version: 1,
            capturedAt: new Date().toISOString(),
            startupMode: profilingMode,
            system: buildSystem(),
            context: buildContext(),
            gpu: await buildGPU(),
            startup: buildStartup(),
            resources: resources.buildResources(),
            eventLoop: buildEventLoop(),
            systemResources: snapshots.buildSystemResourceUsage(),
            ipc: ipc.buildIPC(),
            network: { proxyConfig, probe: networkProbe },
        };

        try {
            fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");
            profilerLogger.info(`Performance report written to: ${outputPath}`);
            new Notification({
                title: "Performance report saved",
                body: "Saved to the app logs folder. Use File -> Show logs to open it.",
            }).show();
        } catch (err) {
            profilerLogger.error("Failed to write performance report:", err);
        }
    } finally {
        resetAll();
    }
}

function arm(cold = false): void {
    updateSettings({ profilingEnabled: true, profilingMode: cold ? "cold" : "warm" });
    profilerLogger.info(`Profiling enabled, mode: ${cold ? "cold" : "warm"}`);

    if (!cold) {
        app.relaunch();
        app.quit();
    } else {
        new Notification({
            title: "Startup profiling enabled",
            body: "The next time you open the app, a performance report will be captured. For best results, restart your computer first.",
        }).show();
    }
}

function resetAll(): void {
    enabled = false;
    writing = false;
    iifeStartPerf = 0;
    forkToIife = null;
    profilingMode = "warm";
    marks.clear();
    eventLoopMonitor?.disable();
    eventLoopMonitor = null;
    ipc.reset();
    resources.reset();
    snapshots.reset();
}

function diff(from: string, to: string): number | null {
    const a = marks.get(from);
    const b = marks.get(to);
    return a !== undefined && b !== undefined ? b - a : null;
}

function buildStartup() {
    const get = (name: string) => marks.get(name) ?? null;
    const loadUrlCalled = get("load-url-called");
    const didFinishLoad = get("did-finish-load");

    const mailFirstByteMs = resources.mainFrameFirstByteMs.get("mail") ?? null;
    const loadUrlToFirstByte =
        loadUrlCalled !== null && mailFirstByteMs !== null ? mailFirstByteMs - loadUrlCalled : null;
    const firstByteToFinishLoad =
        mailFirstByteMs !== null && didFinishLoad !== null ? didFinishLoad - mailFirstByteMs : null;

    const phases = [
        { name: "fork-to-iife-start", ms: forkToIife },
        { name: "iife-start-to-sentry-done", ms: get("sentry-done") },
        { name: "sentry-done-to-squirrel-done", ms: diff("sentry-done", "squirrel-done") },
        { name: "squirrel-done-to-migrations-done", ms: diff("squirrel-done", "migrations-done") },
        { name: "migrations-done-to-app-ready", ms: diff("migrations-done", "app-ready") },
        { name: "app-ready-to-pre-view-creation", ms: diff("app-ready", "pre-view-creation") },
        { name: "pre-view-creation-to-window-created", ms: diff("pre-view-creation", "window-created") },
        { name: "window-created-to-views-created", ms: diff("window-created", "views-created") },
        { name: "views-created-to-load-url-called", ms: diff("views-created", "load-url-called") },
        { name: "load-url-called-to-first-byte", ms: loadUrlToFirstByte },
        { name: "first-byte-to-did-finish-load", ms: firstByteToFinishLoad },
        { name: "did-finish-load-to-window-shown", ms: diff("did-finish-load", "window-shown") },
    ];

    const validMs = phases.map((p) => p.ms).filter((ms): ms is number => ms !== null);
    const complete = validMs.length === phases.length;
    const sumMs = validMs.length > 0 ? validMs.reduce((a, b) => a + b, 0) : null;
    return {
        phases,
        totalMs: complete ? sumMs : null,
        measuredMs: sumMs,
        complete,
        viewFirstByteMs: {
            mail: mailFirstByteMs,
            calendar: resources.mainFrameFirstByteMs.get("calendar") ?? null,
            account: resources.mainFrameFirstByteMs.get("account") ?? null,
        },
    };
}

function buildEventLoop() {
    if (!eventLoopMonitor) return null;
    return {
        p50Ms: Math.round(eventLoopMonitor.percentile(50) / 1e6),
        p95Ms: Math.round(eventLoopMonitor.percentile(95) / 1e6),
        p99Ms: Math.round(eventLoopMonitor.percentile(99) / 1e6),
        maxMs: Math.round(eventLoopMonitor.max / 1e6),
    };
}

export const profiler = { init, mark, hookRequestTiming, ipcMessage, writeReport, arm };
export const profilerTestOnly = { buildStartup, resetAll };
