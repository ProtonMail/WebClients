import { c } from 'ttag';

import type { Maybe } from '@proton/pass/types';

// Apple's documentation
// https://developer.apple.com/documentation/localauthentication/laerror-swift.struct/code?language=objc
//
// For values, objc2-local-authentication is likely more helpful
// https://docs.rs/objc2-local-authentication/latest/src/objc2_local_authentication/generated/LAError.rs.html
export const LA_ERRORS = {
    /// Authentication was not successful because user failed to provide valid credentials.
    AuthenticationFailed: -1,

    /// Authentication was canceled by user (e.g. tapped Cancel button).
    UserCancel: -2,

    /// Authentication was canceled because the user tapped the fallback button (Enter Password).
    UserFallback: -3,

    /// Authentication was canceled by system (e.g. another application went to foreground).
    SystemCancel: -4,

    /// Authentication could not start because passcode is not set on the device.
    PasscodeNotSet: -5,

    /// Authentication could not start because Touch ID is not available on the device.
    TouchIDNotAvailable: -6,

    /// Authentication could not start because Touch ID has no enrolled fingers.
    TouchIDNotEnrolled: -7,

    /// Authentication was not successful because there were too many failed Touch ID attempts and
    /// Touch ID is now locked. Passcode is required to unlock Touch ID, e.g. evaluating
    /// LAPolicyDeviceOwnerAuthenticationWithBiometrics will ask for passcode as a prerequisite.
    TouchIDLockout: -8,

    /// Authentication was canceled by application (e.g. invalidate was called while
    /// authentication was in progress).
    AppCancel: -9,

    /// LAContext passed to this call has been previously invalidated.
    InvalidContext: -10,

    /// Authentication could not start because biometry is not available on the device.
    BiometryNotAvailable: -6,

    /// Authentication could not start because biometry has no enrolled identities.
    BiometryNotEnrolled: -7,

    /// Authentication was not successful because there were too many failed biometry attempts and
    /// biometry is now locked. Passcode is required to unlock biometry, e.g. evaluating
    /// LAPolicyDeviceOwnerAuthenticationWithBiometrics will ask for passcode as a prerequisite.
    BiometryLockout: -8,

    /// Authentication failed because it would require showing UI which has been forbidden
    /// by using interactionNotAllowed property.
    NotInteractive: -1004,

    /// Authentication could not start because there was no paired watch device nearby.
    WatchNotAvailable: -11,

    /// Authentication could not start because there was no paired companion device nearby.
    CompanionNotAvailable: -11,

    /// Authentication could not start because this device supports biometry only via removable accessories and no accessory has been paired.
    BiometryNotPaired: -12,

    /// Authentication could not start because this device supports biometry only via removable accessories and the paired accessory is not connected.
    BiometryDisconnected: -13,

    /// Authentication could not start because dimensions of embedded UI are invalid.
    InvalidDimensions: -14,
};

export const getTranslated = (laErrorCode: number): Maybe<string> => {
    switch (laErrorCode) {
        case LA_ERRORS.UserCancel:
            return c('authenticator-2025:Error').t`Authentication canceled`;
    }
};
