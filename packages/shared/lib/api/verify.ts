export const postVerifySend = (data: {
    Type: 'recovery_email' | 'external_email';
    /* required if type is external_email, optional & not used if type is recovery_email */
    Destination?: string;
}) => ({
    url: 'core/v4/verify/send',
    method: 'post',
    data,
});

export const postVerifyValidate = (data: { JWT: string }) => ({
    url: 'core/v4/verify/validate',
    method: 'post',
    data,
});
