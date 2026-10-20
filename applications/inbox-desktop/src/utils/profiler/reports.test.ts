import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let mockLogsDir = "";

jest.mock("electron", () => ({
    app: { getPath: () => mockLogsDir },
}));

jest.mock("../log", () => ({
    profilerLogger: { info: jest.fn(), error: jest.fn() },
}));

import { getProfilerReports } from "./reports";

const writeLogFile = (name: string, content: string) => fs.writeFileSync(path.join(mockLogsDir, name), content);

describe("getProfilerReports", () => {
    beforeEach(() => {
        mockLogsDir = fs.mkdtempSync(path.join(os.tmpdir(), "profiler-reports-"));
    });

    afterEach(() => {
        fs.rmSync(mockLogsDir, { recursive: true, force: true });
    });

    it("returns the 3 most recent reports, newest first", async () => {
        writeLogFile("proton-mail-profile-2026-10-15T10-00-00-000Z.json", "oldest");
        writeLogFile("proton-mail-profile-2026-10-16T10-00-00-000Z.json", "older");
        writeLogFile("proton-mail-profile-2026-10-17T10-00-00-000Z.json", "middle");
        writeLogFile("proton-mail-profile-2026-10-18T10-00-00-000Z.json", "newest");

        const reports = await getProfilerReports(1024);

        expect(reports.map(({ name, data }) => [name, Buffer.from(data).toString()])).toEqual([
            ["proton-mail-profile-2026-10-18T10-00-00-000Z.json", "newest"],
            ["proton-mail-profile-2026-10-17T10-00-00-000Z.json", "middle"],
            ["proton-mail-profile-2026-10-16T10-00-00-000Z.json", "older"],
        ]);
    });

    it("ignores files that are not profiler reports", async () => {
        writeLogFile("main.log", "log");
        writeLogFile("proton-mail-profile-2026-10-18T10-00-00-000Z.txt", "wrong extension");
        writeLogFile("proton-mail-profile-2026-10-17T10-00-00-000Z.json", "report");

        const reports = await getProfilerReports(1024);

        expect(reports.map(({ name }) => name)).toEqual(["proton-mail-profile-2026-10-17T10-00-00-000Z.json"]);
    });

    it("stops adding reports once the size budget would be exceeded", async () => {
        writeLogFile("proton-mail-profile-2026-10-18T10-00-00-000Z.json", "12345");
        writeLogFile("proton-mail-profile-2026-10-17T10-00-00-000Z.json", "12345");

        const reports = await getProfilerReports(8);

        expect(reports.map(({ name }) => name)).toEqual(["proton-mail-profile-2026-10-18T10-00-00-000Z.json"]);
    });

    it("returns no reports when the budget is exhausted", async () => {
        writeLogFile("proton-mail-profile-2026-10-18T10-00-00-000Z.json", "report");

        expect(await getProfilerReports(0)).toEqual([]);
    });

    it("returns no reports when the logs directory does not exist", async () => {
        fs.rmSync(mockLogsDir, { recursive: true, force: true });

        expect(await getProfilerReports(1024)).toEqual([]);
    });
});
