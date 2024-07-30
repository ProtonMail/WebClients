import type SecurityState from '../interfaces/securityCheckup/SecurityState';

export const getIsPerfectPhraseState = ({ phrase }: SecurityState) => phrase.isAvailable && phrase.isSet;

export const getIsPerfectEmailState = ({ email }: SecurityState) => email.isEnabled && !!email.value && email.verified;
export const getIsAlmostPerfectEmailState = ({ email }: SecurityState) =>
    !!email.value && ((email.isEnabled && !email.verified) || (!email.isEnabled && email.verified));

export const getIsPerfectPhoneState = ({ phone }: SecurityState) => phone.isEnabled && !!phone.value && phone.verified;
export const getIsAlmostPerfectPhoneState = ({ phone }: SecurityState) =>
    !!phone.value && ((phone.isEnabled && !phone.verified) || (!phone.isEnabled && phone.verified));

export const getIsPerfectDeviceRecoveryState = ({ deviceRecovery }: SecurityState) =>
    deviceRecovery.isAvailable && deviceRecovery.isEnabled;
