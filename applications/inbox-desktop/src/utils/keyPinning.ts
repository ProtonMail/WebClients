import crypto from "node:crypto";
import { Request } from "electron";
import { CERT_PROTON_ME } from "../constants";
import { isProdEnv } from "./isProdEnv";
import { isHostAllowed } from "./urls/urlTests";
import { networkLogger } from "./log";
import { sentryReport } from "./sentryReport";

// Report cert pinning failures once per session per hostname to avoid flooding Sentry
const appSessionPinningReported = new Set<string>();
const downloadSessionPinningReported = new Set<string>();

export const checkKeys = (request: Request) => {
    if (isHostAllowed(request.hostname)) {
        // We dont do any verification for dev and testing environments
        if (!isProdEnv()) {
            return 0;
        }

        if (hasProtonMeCert(request)) return 0;

        networkLogger.error("Certificate Pinning failed for host", request.hostname);
        if (!appSessionPinningReported.has(request.hostname)) {
            appSessionPinningReported.add(request.hostname);
            sentryReport.reportMessage("certificate pinning failed", {
                level: "fatal",
                tags: { hostname: request.hostname, context: "app-session" },
            });
        }
        return -2;
    }

    return -3;
};

function hasProtonMeCert(request: Request): boolean {
    const pk = crypto.createPublicKey(request.validatedCertificate.data);
    const hash = crypto
        .createHash("sha256")
        .update(pk.export({ type: "spki", format: "der" }))
        .digest("base64");

    return CERT_PROTON_ME.includes(hash);
}

export function resetPinningReportedTestOnly() {
    appSessionPinningReported.clear();
    downloadSessionPinningReported.clear();
}

export enum VerificationResult {
    Accept = 0,
    Reject = -2,
    UseVerificationFromChromium = -3,
}

export function verifyDownloadCertificate(request: Request, callback: (code: VerificationResult) => void) {
    const code = ((): VerificationResult => {
        if (request.hostname.replace(/^https:\/\//, "") !== "proton.me") {
            return VerificationResult.UseVerificationFromChromium;
        }

        // We dont do any verification for dev and testing environments
        if (!isProdEnv()) {
            return VerificationResult.Accept;
        }

        if (!hasProtonMeCert(request)) {
            networkLogger.error("Certificate Pinning failed for download host", request.hostname);
            if (!downloadSessionPinningReported.has(request.hostname)) {
                downloadSessionPinningReported.add(request.hostname);
                sentryReport.reportMessage("certificate pinning failed", {
                    level: "fatal",
                    tags: { hostname: request.hostname, context: "download-session" },
                });
            }
            return VerificationResult.Reject;
        }

        return VerificationResult.Accept;
    })();

    callback(code);
}
