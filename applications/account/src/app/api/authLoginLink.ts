export const redeemToken = ({ email, token }: { email: string; token: string }) => ({
    method: 'POST',
    url: 'auth/v4/organizations/loginlink/token',
    data: {
        Token: token,
        Email: email,
    },
});

export const verifyCode = ({ code }: { code: string }) => ({
    method: 'POST',
    url: 'auth/v4/organizations/loginlink/verify-code',
    data: {
        Code: code,
    },
});
