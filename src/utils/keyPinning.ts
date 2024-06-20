import crypto from "crypto";
import { Request } from "electron";
import { CERT_PROTON_ME } from "../constants";
import { isProdEnv } from "./config";
import { isHostAllowed } from "./urls/urlTests";

export const checkKeys = (request: Request) => {
    if (isHostAllowed(request.hostname)) {
        // We dont do any verification for dev and testing environments
        if (!isProdEnv()) {
            return 0;
        }

        if (hasProtonMeCert(request)) return 0;

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
            return VerificationResult.Reject;
        }

        return VerificationResult.Accept;
    })();

    callback(code);
}
