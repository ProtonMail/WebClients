import { BASELINE_ALLOWED_PROTOCOLS } from "@proton/shared/lib/desktop/externalProtocols";

import { externalProtocolManager } from "./manager";

describe("ExternalProtocolManager", () => {
    it("seeds both the ipc and redirect sets with the baseline protocols", () => {
        for (const protocol of BASELINE_ALLOWED_PROTOCOLS) {
            expect(externalProtocolManager.getProtocols("ipc").has(protocol)).toBe(true);
            expect(externalProtocolManager.getProtocols("redirect").has(protocol)).toBe(true);
        }
    });

    it("extends only the ipc set without affecting the redirect set", () => {
        externalProtocolManager.extendAllowedProtocols("ipc", ["ipc-only:"]);

        expect(externalProtocolManager.getProtocols("ipc").has("ipc-only:")).toBe(true);
        expect(externalProtocolManager.getProtocols("redirect").has("ipc-only:")).toBe(false);
    });

    it("extends only the redirect set without affecting the ipc set", () => {
        externalProtocolManager.extendAllowedProtocols("redirect", ["redirect-only:"]);

        expect(externalProtocolManager.getProtocols("redirect").has("redirect-only:")).toBe(true);
        expect(externalProtocolManager.getProtocols("ipc").has("redirect-only:")).toBe(false);
    });
});
