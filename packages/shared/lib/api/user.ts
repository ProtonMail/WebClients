import { HumanVerificationMethodType } from '../interfaces';

export const getUser = () => ({
    url: 'users',
    method: 'get',
});

export const queryCreateUser = (data: {
    Username: string;
    Email: string;
    Token?: string;
    TokenType?: HumanVerificationMethodType;
    Type: 1 | 2; // 1 = mail, 2 = VPN
    Referrer?: string;
    Payload?: {
        [key: string]: string;
    };
    Salt?: string;
}) => ({
    url: 'v4/users',
    method: 'post',
    data,
});

export const getRecoveryMethods = (Username: string) => ({
    url: 'users/reset',
    method: 'get',
    params: { Username },
});

export const queryCreateUserExternal = (data: {
    Email: string;
    Token?: string;
    TokenType?: HumanVerificationMethodType;
    Type: 1 | 2; // 1 = mail, 2 = VPN
    Referrer?: string;
    Payload?: {
        [key: string]: string;
    };
    Salt?: string;
}) => ({
    url: 'users/external',
    method: 'post',
    data,
});

export const queryUnlock = () => ({
    url: 'users/unlock',
    method: 'put',
});

export const deleteUser = (data: {
    ClientEphemeral: string;
    ClientProof: string;
    SRPSession: string;
    TwoFactorCode: number;
    Reason?: string;
    Feedback?: string;
    Email?: string;
}) => ({
    url: 'users/delete',
    method: 'put',
    data,
});

export const unlockPasswordChanges = () => ({
    url: 'users/password',
    method: 'put',
});

export const lockSensitiveSettings = () => ({
    url: 'users/lock',
    method: 'put',
});

export const getHumanVerificationMethods = () => ({
    url: 'users/human',
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
    url: 'users/code',
    method: 'post',
    data: { Type, Destination },
});

export const queryCheckUsernameAvailability = (Name: string) => ({
    url: 'users/available',
    method: 'get',
    params: { Name },
});

export const queryDirectSignupStatus = (
    Type: 1 | 2 // 1 = mail, 2 = VPN
) => ({
    url: 'users/direct',
    method: 'get',
    params: { Type },
});

export const queryCheckVerificationCode = (
    Token: string,
    TokenType: 'email' | 'sms' | 'invite' | 'coupon' | 'payment',
    Type: 1 | 2 // 1 = mail, 2 = VPN
) => ({
    url: 'users/check',
    method: 'put',
    data: { Token, TokenType, Type },
});
