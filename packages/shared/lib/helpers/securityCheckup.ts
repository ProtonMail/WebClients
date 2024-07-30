import type SecurityState from '../interfaces/securityCheckup/SecurityState';

export const getIsPerfectPhraseState = ({ phrase }: SecurityState) => phrase.isAvailable && phrase.isSet;

export const getIsPerfectEmailState = ({ email }: SecurityState) => email.isEnabled && !!email.value;

export const getIsPerfectPhoneState = ({ phone }: SecurityState) => phone.isEnabled && !!phone.value;

export const getIsPerfectDeviceRecoveryState = ({ deviceRecovery }: SecurityState) =>
    deviceRecovery.isAvailable && deviceRecovery.isEnabled;
