export const getUser = () => ({
    url: 'users',
    method: 'get'
});

export const queryCreateUser = ({ Auth, Email, Token, TokenType, Type, Username }) => ({
    url: 'users',
    method: 'post',
    data: { Auth, Email, Token, TokenType, Type, Username }
});

export const queryUnlock = () => ({
    url: 'users/unlock',
    method: 'put'
});

export const deleteUser = (data) => ({
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

export const querySMSVerificationCode = (Phone) => ({
    url: 'users/code',
    method: 'post',
    data: {
        Type: 'sms',
        Destination: { Phone }
    }
});

export const queryEmailVerificationCode = (Address) => ({
    url: 'users/code',
    method: 'post',
    data: {
        Type: 'email',
        Destination: { Address }
    }
});

export const queryCheckUsernameAvailability = (Name) => ({
    url: 'users/available',
    method: 'get',
    params: { Name }
});

/**
 * @param {1 | 2} Type 1 = mail, 2 = VPN
 */
export const queryDirectSignupStatus = (Type) => ({
    url: 'users/direct',
    method: 'get',
    params: { Type }
});

/**
 * @param {string} Token
 * @param {'email'|'sms'|'invite'|'coupon'|'payment'} TokenType
 * @param {1 | 2} Type 1 = mail, 2 = VPN
 */
export const queryCheckVerificationCode = (Token, TokenType, Type) => ({
    url: 'users/check',
    method: 'put',
    data: { Token, TokenType, Type }
});
