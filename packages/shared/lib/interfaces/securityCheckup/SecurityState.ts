export default interface SecurityState {
    phrase: {
        isAvailable: boolean;
        isSet: boolean;
        isOutdated: boolean;
    };
    email: {
        value?: string;
        isEnabled: boolean;
    };
    phone: {
        value?: string;
        isEnabled: boolean;
    };
    deviceRecovery: {
        isAvailable: boolean;
        isEnabled: boolean;
    };
}
