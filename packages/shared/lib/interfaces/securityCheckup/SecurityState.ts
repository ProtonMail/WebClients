export default interface SecurityState {
    phrase: {
        isAvailable: boolean;
        isSet: boolean;
        isOutdated: boolean;
    };
    email: {
        value?: string;
        // always false when there is no value
        isEnabled: boolean;
        verified: boolean;
    };
    phone: {
        value?: string;
        // always false when there is no value
        isEnabled: boolean;
        verified: boolean;
    };
    deviceRecovery: {
        isAvailable: boolean;
        isEnabled: boolean;
    };
    hasSentinelEnabled: boolean;
}
