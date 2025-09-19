import { c } from 'ttag';

// https://learn.microsoft.com/en-us/uwp/api/windows.security.credentials.ui.userconsentverificationresult?view=winrt-26100
export const VERIFICATION_RESULTS = {
    // The user was verified.
    Verified: 0,

    // There is no authentication device available.
    DeviceNotPresent: 1,

    // An authentication verifier device is not configured for this user.
    NotConfiguredForUser: 2,

    // Group policy has disabled authentication device verification.
    DisabledByPolicy: 3,

    // The authentication device is performing an operation and is unavailable.
    DeviceBusy: 4,

    // After 10 attempts, the original verification request and all subsequent attempts at the same verification were not verified.
    RetriesExhaused: 5,

    // The verification operation was canceled.
    Canceled: 6,
};

export const getTranslated = (verificationResult: number) => {
    switch (verificationResult) {
        case VERIFICATION_RESULTS.Canceled:
            return c('authenticator-2025:Error').t`Authentication canceled`;
    }
};
