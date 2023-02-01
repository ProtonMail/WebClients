import { ProductParam, getProductHeaders } from '../apps/product';
import { HumanVerificationMethodType } from '../interfaces';

export const getUser = () => ({
    url: 'core/v4/users',
    method: 'get',
});

export const queryCreateUser = (
    data: {
        Username: string;
        Domain?: string;
        Email?: string;
        Phone?: string;
        Type: 1 | 2; // 1 = mail, 2 = VPN
        Referrer?: string;
        ReferralIdentifier?: string;
        ReferralID?: string; // Invite
        Payload?: {
            [key: string]: string;
        };
        Salt?: string;
    },
    product: ProductParam
) => ({
    url: 'core/v4/users',
    method: 'post',
    data,
    headers: getProductHeaders(product),
});

export const getRecoveryMethods = (Username: string) => ({
    url: 'core/v4/users/reset',
    method: 'get',
    params: { Username },
});

export const queryCreateUserExternal = (
    data: {
        Email: string;
        Token?: string;
        TokenType?: HumanVerificationMethodType;
        Type: 1 | 2; // 1 = mail, 2 = VPN
        Referrer?: string;
        Payload?: {
            [key: string]: string;
        };
        Salt?: string;
    },
    product: ProductParam
) => ({
    url: 'core/v4/users/external',
    method: 'post',
    data,
    headers: getProductHeaders(product),
});

export const queryUnlock = () => ({
    url: 'core/v4/users/unlock',
    method: 'put',
});

export const canDelete = () => ({
    url: 'core/v4/users/delete',
    method: 'get',
});

export const deleteUser = (data: { Reason?: string; Feedback?: string; Email?: string }) => ({
    url: 'core/v4/users/delete',
    method: 'put',
    data,
});

export const unlockPasswordChanges = () => ({
    url: 'core/v4/users/password',
    method: 'put',
});

export const lockSensitiveSettings = () => ({
    url: 'core/v4/users/lock',
    method: 'put',
});

export const getHumanVerificationMethods = () => ({
    url: 'core/v4/users/human',
    method: 'get',
});

export const queryVerificationCode = (
    Type: 'email' | 'sms',
    Destination:
        | {
              Address: string;
              Phone?: never;
          }
        | {
              Address?: never;
              Phone: string;
          }
) => ({
    url: 'core/v4/users/code',
    method: 'post',
    data: { Type, Destination },
});

export const queryCheckUsernameAvailability = (Name: string, ParseDomain?: boolean) => ({
    url: 'core/v4/users/available',
    method: 'get',
    params: { Name, ParseDomain: ParseDomain ? 1 : 0 },
});

export const queryCheckEmailAvailability = (Name: string) => ({
    url: 'core/v4/users/availableExternal',
    method: 'get',
    params: { Name },
});

export const queryDirectSignupStatus = (
    Type: 1 | 2 // 1 = mail, 2 = VPN
) => ({
    url: 'core/v4/users/direct',
    method: 'get',
    params: { Type },
});

export const queryCheckVerificationCode = (
    Token: string,
    TokenType: 'email' | 'sms' | 'invite' | 'coupon' | 'payment',
    Type: 1 | 2 // 1 = mail, 2 = VPN
) => ({
    url: 'core/v4/users/check',
    method: 'put',
    data: { Token, TokenType, Type },
});
