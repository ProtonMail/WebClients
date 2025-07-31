import type { enums } from '@proton/crypto';

export * from './Address';
export * from './AddressForwarding';
export * from './Api';
export * from './ApiEnvironmentConfig';
export * from './Category';
export * from './Checklist';
export * from './Domain';
export * from './EncryptionPreferences';
export * from './Environment';
export * from './Group';
export * from './Hotkeys';
export * from './Folder';
export * from './IncomingDefault';
export * from './Key';
export * from './KeySalt';
export * from './KeyTransparency';
export * from './Label';
export * from './MailSettings';
export * from './Member';
export * from './PasswordPolicy';
export * from './Organization';
export * from './OrganizationKey';
export * from './PendingInvitation';
export * from './Referrals';
export * from './SignedKeyList';
export * from './SSO';
export * from './Subscription';
export * from './Support';
export * from './User';
export * from './UserSettings';
export * from './VPN';
export * from './config';
export * from './utils';
export * from './Locale';
export * from './BreachesCount';
export * from './GroupMember';
export * from './referral';

export interface KeyGenConfig {
    type?: 'ecc' | 'rsa';
    curve?: enums.curve;
    rsaBits?: number;
    config?: { v6Keys?: false };
}

/** v6 keys are not compatible with all clients */
export interface KeyGenConfigV6 {
    type?: 'pqc';
    config: { v6Keys: true };
}

export type HumanVerificationMethodType =
    | 'captcha'
    | 'payment'
    | 'sms'
    | 'email'
    | 'invite'
    | 'coupon'
    | 'ownership-email'
    | 'ownership-sms';
