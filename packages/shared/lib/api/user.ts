export const getUser = () => ({
    url: 'users',
    method: 'get'
});

export const queryCreateUser = (data: {
    Username: string;
    Email: string;
    Token: string;
    TokenType: 'captcha' | 'email' | 'sms' | 'invite' | 'payment';
    Type: 1 | 2; // 1 = mail, 2 = VPN
    Auth: {
        Version: number;
        ModulusID: string;
        Salt: string;
        Verifier: string;
    };
    Referrer?: string;
    Payload?: {
        [key: string]: string;
    };
    Salt?: string;
}) => ({
    url: 'users',
    method: 'post',
    data
});

export const queryUnlock = () => ({
    url: 'users/unlock',
    method: 'put'
});

export const deleteUser = (data: {
    ClientEphemeral: string;
    ClientProof: string;
    SRPSession: string;
    TwoFactorCode: number;
}) => ({
    url: 'users/delete',
    method: 'put',
    data
});

export const unlockPasswordChanges = () => ({
    url: 'users/password',
    method: 'put'
});

export const lockSensitiveSettings = () => ({
    url: 'users/lock',
    method: 'put'
});

export const getHumanVerificationMethods = () => ({
    url: 'users/human',
    method: 'get'
});

export const queryVerificationCode = (
    Type: 'email' | 'sms',
    Destination: {
        Address: string;
        Phone?: never;
    } | {
        Address?: never;
        Phone: string;
    }
) => ({
    url: 'users/code',
    method: 'post',
    data: { Type, Destination }
});

export const queryCheckUsernameAvailability = (Name: string) => ({
    url: 'users/available',
    method: 'get',
    params: { Name }
});

export const queryDirectSignupStatus = (
    Type: 1 | 2 // 1 = mail, 2 = VPN
) => ({
    url: 'users/direct',
    method: 'get',
    params: { Type }
});

export const queryCheckVerificationCode = (
    Token: string,
    TokenType: 'email' | 'sms' | 'invite' | 'coupon' | 'payment',
    Type: 1 | 2 // 1 = mail, 2 = VPN
) => ({
    url: 'users/check',
    method: 'put',
    data: { Token, TokenType, Type }
});
