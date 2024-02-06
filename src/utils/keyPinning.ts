import crypto from "crypto";
import { Request, app } from "electron";
import { CERT_PROTON_ME } from "./constants";
import { isHostAllowed } from "./helpers";

export const checkKeys = (request: Request) => {
    if (isHostAllowed(request.hostname, app.isPackaged)) {
        // We dont do any verification for dev
        if (!app.isPackaged) {
            return 0;
        }

        const pk = crypto.createPublicKey(request.validatedCertificate.data);
        const hash = crypto
            .createHash("sha256")
            .update(pk.export({ type: "spki", format: "der" }))
            .digest("base64");

        if (CERT_PROTON_ME.includes(hash)) {
            return 0;
        }

        return -2;
    }

    return -3;
};
