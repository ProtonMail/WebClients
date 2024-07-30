export default interface SecurityState {
    phrase: {
        isAvailable: boolean;
        isSet: boolean;
        isOutdated: boolean;
    };
    email: {
        value?: string;
        isEnabled: boolean;
        verified: boolean;
    };
    phone: {
        value?: string;
        isEnabled: boolean;
        verified: boolean;
    };
    deviceRecovery: {
        isAvailable: boolean;
        isEnabled: boolean;
    };
}
