import path from "node:path";
import fs from "node:fs";
import { app, Notification, session as electronSession } from "electron";
import { monitorEventLoopDelay, performance } from "node:perf_hooks";
import { getSettings, updateSettings } from "../../store/settingsStore";
import { getAppURL } from "../../store/urlStore";
import { profilerLogger } from "../log";
import { buildNetworkProbe } from "./network";
import { SnapshotRecorder } from "./snapshots";
import { IpcRecorder } from "./ipc";
import { StartupRequestRecorder } from "./startupRequests";
import { systemContext } from "./system";

class Profiler {
    private static instance: Profiler;
    private enabled = false;
    private writing = false;
    private iifeStartPerf = 0; // performance.now() — used for all other timing
    private forkToIife: number | null = null;
    private profilingMode: "warm" | "cold" = "warm";
    private marks = new Map<string, number>();
    private eventLoopMonitor: ReturnType<typeof monitorEventLoopDelay> | null = null;
    private electronSession: Electron.Session | null = null;

    private ipc: IpcRecorder | null = null;
    private snapshots: SnapshotRecorder | null = null;
    private startupRequestsRecorder: StartupRequestRecorder | null = null;

    private constructor() {}

    public static getInstance(): Profiler {
        if (!Profiler.instance) {
            Profiler.instance = new Profiler();
        }
        return Profiler.instance;
    }

    public init(iifeStartMs: number, iifeStartPerfMeasured: number): void {
        const settings = getSettings();
        if (!settings.profilingEnabled) return;

        this.enabled = true;
        this.iifeStartPerf = iifeStartPerfMeasured;
        this.profilingMode = settings.profilingMode ?? "warm";

        // Get process creation time from the OS, from fork() on Unix. Must use unix timestamps.
        const creationTime = process.getCreationTime();
        this.forkToIife = creationTime !== null ? iifeStartMs - creationTime : null;

        this.snapshots = new SnapshotRecorder();

        profilerLogger.info(`Profiler started, mode: ${this.profilingMode}`);
    }

    public mark(name: string): void {
        if (!this.enabled) return;
        if (this.marks.has(name)) return; // only record first call

        this.marks.set(name, performance.now() - this.iifeStartPerf);

        switch (name) {
            case "app-ready":
                this.eventLoopMonitor = monitorEventLoopDelay({ resolution: 20 });
                this.eventLoopMonitor.enable();
                break;

            case "load-url-called":
                if (this.electronSession) {
                    this.startupRequestsRecorder = new StartupRequestRecorder(this.electronSession, this.iifeStartPerf);
                }
                break;

            case "did-finish-load":
                this.startupRequestsRecorder?.closeResourceWindow();
                break;

            case "window-shown": {
                const windowShownMs = this.marks.get("window-shown") ?? 0;
                this.snapshots?.captureSystemMemory();
                this.snapshots?.captureProcessSnapshot("window-shown", this.iifeStartPerf, windowShownMs);
                this.eventLoopMonitor?.disable();
                this.ipc = new IpcRecorder(windowShownMs, this.iifeStartPerf);
                break;
            }
        }
    }

    public registerElectronSession(session: Electron.Session): void {
        this.electronSession = session;
    }

    public ipcMessage(channel: string, type: string, handlerMs: number): void {
        if (!this.enabled) return;
        this.ipc?.ipcMessage(channel, type, handlerMs);
    }

    private async writeReport(): Promise<void> {
        if (!this.enabled || this.writing) return;
        this.writing = true;

        profilerLogger.info("Writing performance report...");

        try {
            const windowShownMs = this.marks.get("window-shown") ?? 0;

            // Collect IPC messages and process snapshots over 10s
            this.snapshots?.captureProcessSnapshot("report-start", this.iifeStartPerf, windowShownMs);
            await new Promise<void>((resolve) => setTimeout(resolve, 5_000));

            this.snapshots?.captureProcessSnapshot("report-midpoint", this.iifeStartPerf, windowShownMs);
            await new Promise<void>((resolve) => setTimeout(resolve, 5_000));

            this.snapshots?.captureProcessSnapshot("report-end", this.iifeStartPerf, windowShownMs);
            this.ipc?.closeIpcWindow();

            // Disable early so mark/ipcMessage become no-ops during report generation.
            // resetAll() in finally also clears this, but the early disable is intentional.
            this.enabled = false;
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
                startupMode: this.profilingMode,
                system: systemContext.buildSystem(),
                context: systemContext.buildContext(),
                gpu: await systemContext.buildGPU(),
                startup: this.buildStartup(),
                resources: this.startupRequestsRecorder?.buildResources() ?? null,
                eventLoop: this.buildEventLoop(),
                systemResources: this.snapshots?.buildSystemResourceUsage() ?? null,
                ipc: this.ipc?.build() ?? null,
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
            this.resetAll();
        }
    }

    public arm(cold = false): void {
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

    // Public for testing
    public resetAll(): void {
        this.enabled = false;
        this.writing = false;
        this.iifeStartPerf = 0;
        this.forkToIife = null;
        this.profilingMode = "warm";
        this.marks.clear();
        this.eventLoopMonitor?.disable();
        this.eventLoopMonitor = null;

        this.startupRequestsRecorder?.cleanup();
        this.startupRequestsRecorder = null;

        this.ipc = null;

        this.snapshots = null;
    }

    private diff(from: string, to: string): number | null {
        const a = this.marks.get(from);
        const b = this.marks.get(to);
        return a !== undefined && b !== undefined ? b - a : null;
    }

    // Public for testing
    public buildStartup() {
        const get = (name: string) => this.marks.get(name) ?? null;
        const loadUrlCalled = get("load-url-called");
        const didFinishLoad = get("did-finish-load");

        const mailFirstByteMs = this.startupRequestsRecorder?.mainFrameFirstByteMs.get("mail") ?? null;
        const loadUrlToFirstByte =
            loadUrlCalled !== null && mailFirstByteMs !== null ? mailFirstByteMs - loadUrlCalled : null;
        const firstByteToFinishLoad =
            mailFirstByteMs !== null && didFinishLoad !== null ? didFinishLoad - mailFirstByteMs : null;

        const phases = [
            { name: "fork-to-iife-start", ms: this.forkToIife },
            { name: "iife-start-to-sentry-done", ms: get("sentry-done") },
            { name: "sentry-done-to-squirrel-done", ms: this.diff("sentry-done", "squirrel-done") },
            { name: "squirrel-done-to-migrations-done", ms: this.diff("squirrel-done", "migrations-done") },
            { name: "migrations-done-to-app-ready", ms: this.diff("migrations-done", "app-ready") },
            { name: "app-ready-to-pre-view-creation", ms: this.diff("app-ready", "pre-view-creation") },
            { name: "pre-view-creation-to-window-created", ms: this.diff("pre-view-creation", "window-created") },
            { name: "window-created-to-views-created", ms: this.diff("window-created", "views-created") },
            { name: "views-created-to-load-url-called", ms: this.diff("views-created", "load-url-called") },
            { name: "load-url-called-to-first-byte", ms: loadUrlToFirstByte },
            { name: "first-byte-to-did-finish-load", ms: firstByteToFinishLoad },
            { name: "did-finish-load-to-window-shown", ms: this.diff("did-finish-load", "window-shown") },
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
                calendar: this.startupRequestsRecorder?.mainFrameFirstByteMs.get("calendar") ?? null,
                account: this.startupRequestsRecorder?.mainFrameFirstByteMs.get("account") ?? null,
            },
        };
    }

    private buildEventLoop() {
        if (!this.eventLoopMonitor) return null;
        return {
            p50Ms: Math.round(this.eventLoopMonitor.percentile(50) / 1e6),
            p95Ms: Math.round(this.eventLoopMonitor.percentile(95) / 1e6),
            p99Ms: Math.round(this.eventLoopMonitor.percentile(99) / 1e6),
            maxMs: Math.round(this.eventLoopMonitor.max / 1e6),
        };
    }

    public markWindowShownAndWriteReport() {
        this.mark("window-shown");
        this.writeReport();
    }
}

export const profiler = Profiler.getInstance();
export const profilerTestOnly = {
    buildStartup: () => profiler.buildStartup(),
    resetAll: () => profiler.resetAll(),
};
