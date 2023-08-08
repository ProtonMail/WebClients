import type { enums } from '@proton/crypto';

export * from './Address';
export * from './Api';
export * from './ApiEnvironmentConfig';
export * from './Checklist';
export * from './Domain';
export * from './EncryptionPreferences';
export * from './Environment';
export * from './Hotkeys';
export * from './IncomingDefault';
export * from './Key';
export * from './KeySalt';
export * from './KeyTransparency';
export * from './Label';
export * from './MailSettings';
export * from './Member';
export * from './Organization';
export * from './OrganizationKey';
export * from './PendingInvitation';
export * from './Referrals';
export * from './SignedKeyList';
export * from './Subscription';
export * from './User';
export * from './UserSettings';
export * from './VPN';
export * from './config';
export * from './utils';

export interface EncryptionConfig {
    type?: 'ecc' | 'rsa';
    curve?: enums.curve;
    rsaBits?: number;
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
