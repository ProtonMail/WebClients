import {
    PROTOCOLS,
    DefaultProtocol,
    DefaultProtocolsStored,
    DefaultProtocolStored,
    parseDefaultProtocolsStored,
    UNCHECKED_PROTOCOL,
} from "@proton/shared/lib/desktop/DefaultProtocol";
import Store from "electron-store";
import { protocolLogger } from "../log";

const DEFAULT_STORED_DEFAULT_PROTOCOL = {
    mailto: {
        shouldBeDefault: false,
        wasDefaultInPast: false,
        lastReport: {
            wasDefault: false,
            timestamp: 0,
        },
    },
} satisfies DefaultProtocolsStored;

const store = new Store<{ defaultProtocols: DefaultProtocolsStored }>();

const notChecked = (stored: DefaultProtocolStored): DefaultProtocol => ({
    ...UNCHECKED_PROTOCOL,
    ...stored,
});

function getDefaultProtocolsStored(): DefaultProtocolsStored {
    try {
        const storedDefaults = parseDefaultProtocolsStored(
            store.get("defaultProtocols", DEFAULT_STORED_DEFAULT_PROTOCOL),
        );
        return storedDefaults ?? DEFAULT_STORED_DEFAULT_PROTOCOL;
    } catch (e) {
        protocolLogger.error("Failed to retrieve correct data, restoring defaults");
        store.set("defaultProtocols", DEFAULT_STORED_DEFAULT_PROTOCOL);
        return DEFAULT_STORED_DEFAULT_PROTOCOL;
    }
}

export function loadDefaultProtocol(protocol: PROTOCOLS): DefaultProtocol {
    const current = getDefaultProtocolsStored();
    return notChecked(current[protocol]);
}

export function storeDefaultProtocol(protocol: PROTOCOLS, data: DefaultProtocol) {
    const current = getDefaultProtocolsStored();

    current[protocol].shouldBeDefault = data.shouldBeDefault;
    current[protocol].wasDefaultInPast = data.wasDefaultInPast;
    current[protocol].lastReport = data.lastReport;

    store.set("defaultProtocols", current);
    protocolLogger.debug("Storing default protocols:", current);
}
