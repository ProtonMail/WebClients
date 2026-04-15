import crypto from "node:crypto";
import { Request } from "electron";
import { CERT_LIVEKIT_PROTON_ME, CERT_PROTON_ME } from "../constants";
import { isProdEnv } from "./isProdEnv";
import { isHostAllowed } from "./urls/urlTests";
import { mainLogger } from "./log";

export const checkKeys = (request: Request) => {
    if (isHostAllowed(request.hostname) || request.hostname.endsWith(".proton.me")) {
        // We dont do any verification for dev and testing environments
        if (!isProdEnv()) {
            return 0;
        }

        if (hasProtonMeCert(request)) {
            return 0;
        }

        mainLogger.error("Certificate pinning failed", request.hostname);
        return -2;
    }

    return -3;
};

function hasLiveKitProtonMeCert(request: Request): boolean {
    const pk = crypto.createPublicKey(request.validatedCertificate.data);
    const hash = crypto
        .createHash("sha256")
        .update(pk.export({ type: "spki", format: "der" }))
        .digest("base64");

    return CERT_LIVEKIT_PROTON_ME.includes(hash);
}

function hasProtonMeCert(request: Request): boolean {
    const pk = crypto.createPublicKey(request.validatedCertificate.data);
    const hash = crypto
        .createHash("sha256")
        .update(pk.export({ type: "spki", format: "der" }))
        .digest("base64");

    return CERT_PROTON_ME.includes(hash);
}

export enum VerificationResult {
    Accept = 0,
    Reject = -2,
    UseVerificationFromChromium = -3,
}

export function verifyDownloadCertificate(request: Request, callback: (code: VerificationResult) => void) {
    const code = ((): VerificationResult => {
        const hostname = request.hostname.replace(/^https:\/\//, "");

        if (hostname !== "proton.me" && hostname !== "livekit.proton.me") {
            return VerificationResult.UseVerificationFromChromium;
        }

        // We dont do any verification for dev and testing environments
        if (!isProdEnv()) {
            return VerificationResult.Accept;
        }

        if (hostname === "livekit.proton.me") {
            return hasLiveKitProtonMeCert(request) ? VerificationResult.Accept : VerificationResult.Reject;
        }

        if (!hasProtonMeCert(request)) {
            return VerificationResult.Reject;
        }

        return VerificationResult.Accept;
    })();

    callback(code);
}
