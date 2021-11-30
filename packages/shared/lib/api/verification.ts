export const getVerificationDataRoute = (token: string) => ({
    url: `core/v4/verification/ownership/${token}`,
    method: 'get',
});

export const sendVerificationCode = (token: string) => ({
    url: `core/v4/verification/ownership/${token}`,
    method: 'post',
});

export const verifyVerificationCode = (token: string, code: string) => ({
    url: `core/v4/verification/ownership/${token}/${code}`,
    method: 'post',
});
