import { Session } from "electron";
import { getAppURL } from "../store/urlStore";
import { appSession } from "./electronSession/partitions";
import { networkLogger } from "./log";
import { probeOnce } from "./profiler/network";

const DIAGNOSTICS_INTERVAL_MS = 5 * 60 * 1000; // 5 mins

let lastRunAt: number | null = null;

const resolveAddresses = async (session: Session, hostname: string) => {
    try {
        const { endpoints } = await session.resolveHost(hostname, { cacheUsage: "disallowed" });
        return endpoints.map(({ address }) => address);
    } catch (error) {
        return error instanceof Error ? error.message : String(error);
    }
};

const logTargetDiagnostics = async (session: Session, url: string) => {
    const { hostname } = new URL(url);
    const [addresses, { ttfbMs, errorCode }] = await Promise.all([
        resolveAddresses(session, hostname),
        probeOnce(url, session),
    ]);

    networkLogger.info("Network diagnostics", hostname, {
        dns: addresses,
        reachable: errorCode === null,
        ...(errorCode === null ? { ttfbMs } : { errorCode }),
    });
};

export async function logNetworkDiagnostics(): Promise<void> {
    if (lastRunAt !== null && Date.now() - lastRunAt < DIAGNOSTICS_INTERVAL_MS) {
        return;
    }

    lastRunAt = Date.now();

    try {
        const session = appSession();
        const { mail, account } = getAppURL();
        const proxy = await session.resolveProxy(mail).catch((error: Error) => error.message);
        networkLogger.info("Network diagnostics proxy:", proxy);

        await Promise.all([mail, account].map((url) => logTargetDiagnostics(session, url)));
    } catch (error) {
        networkLogger.error("Network diagnostics failed", error);
    }
}

export function resetNetworkDiagnosticsTestOnly() {
    lastRunAt = null;
}
