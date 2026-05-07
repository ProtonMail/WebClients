export type SafetyReviewRecoveryState = {
    email: { isEnabled: boolean; hasValue: boolean };
    phone: { isEnabled: boolean; hasValue: boolean };
    deviceRecovery: { isAvailable: boolean; isEnabled: boolean };
    phrase: { isAvailable: boolean; isSet: boolean };
    recoveryContactsData: { isAvailable: boolean; isEnabled: boolean };
    emergencyContactsData: { isAvailable: boolean; isEnabled: boolean };
};
