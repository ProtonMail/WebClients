import type SecurityState from '../interfaces/securityCheckup/SecurityState';

export const getIsPerfectPhraseState = ({ phrase }: SecurityState) => phrase.isAvailable && phrase.isSet;

export const getEmailRecoveryEnabled = ({ email }: SecurityState) => email.isEnabled && !!email.value;
export const getIsPerfectEmailState = (securityState: SecurityState) =>
    getEmailRecoveryEnabled(securityState) && securityState.email.verified;

export const getIsPerfectSentinelEmailState = ({ email }: SecurityState) =>
    !!email.value && email.verified && !email.isEnabled;

export const getIsAlmostPerfectEmailState = ({ email }: SecurityState) =>
    !!email.value && ((email.isEnabled && !email.verified) || (!email.isEnabled && email.verified));

export const getPhoneRecoveryEnabled = ({ phone }: SecurityState) => phone.isEnabled && !!phone.value;
export const getIsPerfectPhoneState = (securityState: SecurityState) =>
    getPhoneRecoveryEnabled(securityState) && securityState.phone.verified;

export const getIsPerfectSentinelPhoneState = ({ phone }: SecurityState) =>
    !!phone.value && phone.verified && !phone.isEnabled;

export const getIsAlmostPerfectPhoneState = ({ phone }: SecurityState) =>
    !!phone.value && ((phone.isEnabled && !phone.verified) || (!phone.isEnabled && phone.verified));

export const getIsPerfectDeviceRecoveryState = ({ deviceRecovery }: SecurityState) =>
    deviceRecovery.isAvailable && deviceRecovery.isEnabled;
