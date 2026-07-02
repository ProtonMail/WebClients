import {
    BASELINE_ALLOWED_PROTOCOLS,
    BASELINE_ALLOWED_CONTENT_PROTOCOLS,
    type ProtocolSource,
} from "@proton/shared/lib/desktop/externalProtocols";

class ExternalProtocolManager {
    private _protocols: Record<ProtocolSource, Set<string>> = {
        ipc: new Set<string>(BASELINE_ALLOWED_PROTOCOLS),
        redirect: new Set<string>(BASELINE_ALLOWED_CONTENT_PROTOCOLS),
    };

    private static instance: ExternalProtocolManager;

    public getProtocols(source: ProtocolSource): Set<string> {
        return this._protocols[source];
    }

    public extendAllowedProtocols(source: ProtocolSource, protocols: string[]): void {
        for (const protocol of protocols) {
            this._protocols[source].add(protocol);
        }
    }

    public static getInstance(): ExternalProtocolManager {
        if (!ExternalProtocolManager.instance) {
            ExternalProtocolManager.instance = new ExternalProtocolManager();
        }
        return ExternalProtocolManager.instance;
    }
}

export const externalProtocolManager = ExternalProtocolManager.getInstance();
