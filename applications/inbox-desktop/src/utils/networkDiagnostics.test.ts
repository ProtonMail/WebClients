import { describe, it, expect, beforeEach } from "@jest/globals";

const mockSession = {
    resolveHost: jest.fn(),
    resolveProxy: jest.fn(),
};

jest.mock("electron", () => ({}));

jest.mock("../store/urlStore", () => ({
    getAppURL: () => ({
        account: "https://account.proton.me",
        mail: "https://mail.proton.me",
        calendar: "https://calendar.proton.me",
    }),
}));

jest.mock("./electronSession/partitions", () => ({
    appSession: () => mockSession,
}));

jest.mock("./log", () => ({
    networkLogger: { info: jest.fn(), error: jest.fn() },
}));

jest.mock("./profiler/network", () => ({
    probeOnce: jest.fn(),
}));

import { networkLogger } from "./log";
import { probeOnce } from "./profiler/network";
import { logNetworkDiagnostics, resetNetworkDiagnosticsTestOnly } from "./networkDiagnostics";

const mockProbeOnce = probeOnce as jest.Mock;
const mockLoggerInfo = networkLogger.info as jest.Mock;

const FIVE_MINUTES_MS = 5 * 60 * 1000;

describe("logNetworkDiagnostics", () => {
    let now: number;

    beforeEach(() => {
        jest.clearAllMocks();
        resetNetworkDiagnosticsTestOnly();
        now = 1_000_000;
        jest.spyOn(Date, "now").mockImplementation(() => now);

        mockSession.resolveProxy.mockResolvedValue("PROXY corp-proxy:8080");
        mockSession.resolveHost.mockResolvedValue({ endpoints: [{ address: "185.70.42.37", family: "ipv4" }] });
        mockProbeOnce.mockResolvedValue({ ttfbMs: 120, errorCode: null });
    });

    it("logs the proxy and the DNS addresses and reachability of the mail and account hosts", async () => {
        await logNetworkDiagnostics();

        expect(mockSession.resolveProxy).toHaveBeenCalledWith("https://mail.proton.me");
        expect(mockLoggerInfo).toHaveBeenCalledWith("Network diagnostics proxy:", "PROXY corp-proxy:8080");
        expect(mockLoggerInfo).toHaveBeenCalledWith("Network diagnostics", "mail.proton.me", {
            dns: ["185.70.42.37"],
            reachable: true,
            ttfbMs: 120,
        });
        expect(mockLoggerInfo).toHaveBeenCalledWith("Network diagnostics", "account.proton.me", {
            dns: ["185.70.42.37"],
            reachable: true,
            ttfbMs: 120,
        });
    });

    it("probes through the app session and bypasses the DNS cache", async () => {
        await logNetworkDiagnostics();

        expect(mockProbeOnce).toHaveBeenCalledWith("https://mail.proton.me", mockSession);
        expect(mockProbeOnce).toHaveBeenCalledWith("https://account.proton.me", mockSession);
        expect(mockSession.resolveHost).toHaveBeenCalledWith("mail.proton.me", { cacheUsage: "disallowed" });
        expect(mockSession.resolveHost).toHaveBeenCalledWith("account.proton.me", { cacheUsage: "disallowed" });
    });

    it("logs the DNS error and request error code when a host cannot be reached", async () => {
        mockSession.resolveHost.mockRejectedValue(new Error("net::ERR_NAME_NOT_RESOLVED"));
        mockProbeOnce.mockResolvedValue({ ttfbMs: null, errorCode: "net::ERR_NAME_NOT_RESOLVED" });

        await logNetworkDiagnostics();

        expect(mockLoggerInfo).toHaveBeenCalledWith("Network diagnostics", "mail.proton.me", {
            dns: "net::ERR_NAME_NOT_RESOLVED",
            reachable: false,
            errorCode: "net::ERR_NAME_NOT_RESOLVED",
        });
    });

    it("runs at most once every 5 minutes", async () => {
        await logNetworkDiagnostics();
        now += FIVE_MINUTES_MS - 1;
        await logNetworkDiagnostics();

        expect(mockSession.resolveProxy).toHaveBeenCalledTimes(1);

        now += 1;
        await logNetworkDiagnostics();

        expect(mockSession.resolveProxy).toHaveBeenCalledTimes(2);
    });
});
