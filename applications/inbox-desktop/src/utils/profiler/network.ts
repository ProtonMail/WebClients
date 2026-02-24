import { performance } from "node:perf_hooks";
import { net } from "electron";

const PROBE_TARGETS = ["https://mail.proton.me", "https://mail-api.proton.me"] as const;
const PROBE_COUNT = 3;
const PROBE_TIMEOUT_MS = 3000;
const PROBE_GAP_MS = 200;

interface TargetProbeResult {
    probes: (number | null)[];
    errors: (string | null)[];
    avgMs: number | null;
    minMs: number | null;
    maxMs: number | null;

    estimatedDnsMs: number | null;
    failCount: number;
    blocked: boolean;
}

// ttfbMs - time to first byte in Ms
function probeOnce(url: string): Promise<{ ttfbMs: number | null; errorCode: string | null }> {
    return new Promise((resolve) => {
        const start = performance.now();
        let settled = false;
        const settle = (result: { ttfbMs: number | null; errorCode: string | null }) => {
            if (settled) return;
            settled = true;
            resolve(result);
        };

        const req = net.request({ method: "HEAD", url });
        req.setHeader("Connection", "close");

        const timer = setTimeout(() => {
            req.abort();
            settle({ ttfbMs: null, errorCode: "timeout" });
        }, PROBE_TIMEOUT_MS);

        req.on("response", () => {
            clearTimeout(timer);
            settle({ ttfbMs: Math.round(performance.now() - start), errorCode: null });
        });

        req.on("error", (err: Error) => {
            clearTimeout(timer);
            const code = (err as NodeJS.ErrnoException).code ?? err.message ?? "unknown";
            settle({ ttfbMs: null, errorCode: code });
        });

        req.end();
    });
}

async function probeTarget(url: string): Promise<TargetProbeResult> {
    const entries: { ttfbMs: number | null; errorCode: string | null }[] = [];
    for (let i = 0; i < PROBE_COUNT; i++) {
        entries.push(await probeOnce(url));
        if (i < PROBE_COUNT - 1) {
            await new Promise<void>((r) => setTimeout(r, PROBE_GAP_MS));
        }
    }

    const successMs = entries
        .filter((e): e is { ttfbMs: number; errorCode: null } => e.ttfbMs !== null)
        .map((e) => e.ttfbMs);
    const failCount = PROBE_COUNT - successMs.length;
    const blocked = failCount === PROBE_COUNT;

    const p0 = entries[0].ttfbMs;
    const p1 = entries[1]?.ttfbMs ?? null;
    const estimatedDnsMs = p0 !== null && p1 !== null ? Math.max(0, p0 - p1) : null;

    return {
        probes: entries.map((e) => e.ttfbMs),
        errors: entries.map((e) => e.errorCode),
        avgMs: successMs.length > 0 ? Math.round(successMs.reduce((a, b) => a + b, 0) / successMs.length) : null,
        minMs: successMs.length > 0 ? Math.min(...successMs) : null,
        maxMs: successMs.length > 0 ? Math.max(...successMs) : null,
        estimatedDnsMs,
        failCount,
        blocked,
    };
}

export async function buildNetworkProbe(): Promise<Record<string, TargetProbeResult>> {
    const results = await Promise.all(PROBE_TARGETS.map((target) => probeTarget(target)));
    return Object.fromEntries(PROBE_TARGETS.map((t, i) => [new URL(t).hostname, results[i]]));
}
