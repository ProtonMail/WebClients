export const getVerificationDataRoute = (token: string, method: string) => ({
    url: `core/v4/verification/${method}/${token}`,
    method: 'get',
});

export const sendVerificationCode = (token: string, method: string) => ({
    url: `core/v4/verification/${method}/${token}`,
    method: 'post',
});

export const verifyVerificationCode = (token: string, method: string, code: string) => ({
    url: `core/v4/verification/${method}/${token}/${code}`,
    method: 'post',
});
