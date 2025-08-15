import type { ProductParam } from '../apps/product';
import { getProductHeaders } from '../apps/product';
import type { CLIENT_TYPES } from '../constants';
import type { FetchConfig } from '../fetch/interface';
import type { HumanVerificationMethodType } from '../interfaces';

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
        Type: CLIENT_TYPES; // 1 = mail, 2 = VPN
        Referrer?: string;
        ReferralIdentifier?: string;
        ReferralID?: string; // Invite
        TokenPayment?: string;
        Payload?: {
            [key: string]: string;
        };
        Salt?: string;
    },
    product: ProductParam
): FetchConfig => ({
    url: 'core/v4/users',
    method: 'post',
    data,
    headers: getProductHeaders(product, {
        endpoint: 'core/v4/users',
        product,
    }),
});

export const getRecoveryMethods = (Username: string): FetchConfig => ({
    url: 'core/v4/users/reset',
    method: 'get',
    params: { Username },
});

export const queryCreateUserExternal = (
    data: {
        Email?: string;
        Token?: string;
        TokenType?: HumanVerificationMethodType;
        Type: CLIENT_TYPES; // 1 = mail, 2 = VPN
        Referrer?: string;
        TokenPayment?: string;
        TokenPreVerifiedAddress?: string;
        Payload?: {
            [key: string]: string;
        };
        Salt?: string;
    },
    product: ProductParam
): FetchConfig => ({
    url: 'core/v4/users/external',
    method: 'post',
    data,
    headers: getProductHeaders(product, {
        endpoint: 'core/v4/users/external',
        product,
    }),
});

export const queryUnlock = (): FetchConfig => ({
    url: 'core/v4/users/unlock',
    method: 'put',
});

export const canDelete = (): FetchConfig => ({
    url: 'core/v4/users/delete',
    method: 'get',
});

export const deleteUser = (data: { Reason?: string; Feedback?: string; Email?: string }): FetchConfig => ({
    url: 'core/v4/users/delete',
    method: 'put',
    data,
});

export const unlockPasswordChanges = (): FetchConfig => ({
    url: 'core/v4/users/password',
    method: 'put',
});

export const lockSensitiveSettings = (): FetchConfig => ({
    url: 'core/v4/users/lock',
    method: 'put',
});

export const getHumanVerificationMethods = (): FetchConfig => ({
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
    Type: CLIENT_TYPES // 1 = mail, 2 = VPN
): FetchConfig => ({
    url: 'core/v4/users/direct',
    method: 'get',
    params: { Type },
});

export const queryCheckVerificationCode = (
    Token: string,
    TokenType: 'email' | 'sms' | 'invite' | 'coupon' | 'payment',
    Type: CLIENT_TYPES // 1 = mail, 2 = VPN
): FetchConfig => ({
    url: 'core/v4/users/check',
    method: 'put',
    data: { Token, TokenType, Type },
});

export const getInvitations = (): FetchConfig => ({
    url: 'core/v4/users/invitations',
    method: 'get',
});

export const getInvitation = (invitationID: string): FetchConfig => ({
    url: `core/v4/users/invitations/${invitationID}`,
    method: 'get',
});

export const acceptInvitation = (invitationID: string): FetchConfig => ({
    url: `core/v4/users/invitations/${invitationID}/accept`,
    method: 'post',
});

export const rejectInvitation = (invitationID: string): FetchConfig => ({
    url: `core/v4/users/invitations/${invitationID}/reject`,
    method: 'post',
});

export const disableUser = (data: { JWT: string }): FetchConfig => ({
    url: `core/v4/users/disable/${data.JWT}`,
    method: 'get',
});
