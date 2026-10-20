import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { profilerLogger } from "../log";

export const PROFILER_REPORT_PREFIX = "proton-mail-profile-";
export const PROFILER_REPORT_EXTENSION = ".json";
const MAX_REPORTS = 3;

export type ProfilerReport = { name: string; data: Uint8Array };

const isProfilerReport = (filename: string) =>
    filename.startsWith(PROFILER_REPORT_PREFIX) && filename.endsWith(PROFILER_REPORT_EXTENSION);

export async function getProfilerReports(maxSizeBytes = Number.POSITIVE_INFINITY): Promise<ProfilerReport[]> {
    try {
        const logsDir = app.getPath("logs");
        const latestFilenames = (await fs.promises.readdir(logsDir))
            .filter(isProfilerReport)
            .sort()
            .reverse()
            .slice(0, MAX_REPORTS);

        const reports: ProfilerReport[] = [];
        let totalSize = 0;
        for (const name of latestFilenames) {
            const data = await fs.promises.readFile(path.join(logsDir, name));
            if (totalSize + data.length > maxSizeBytes) {
                break;
            }
            totalSize += data.length;
            reports.push({ name, data: new Uint8Array(data) });
        }

        profilerLogger.info(`Profiler reports collected: ${reports.length} files, ${totalSize} bytes`);
        return reports;
    } catch (error) {
        profilerLogger.error("Could not collect profiler reports, error:", error);
        return [];
    }
}
