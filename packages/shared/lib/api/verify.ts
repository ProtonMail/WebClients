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

export const postVerifyUnvalidate = (data: { JWT: string }) => ({
    url: 'core/v4/verify/validate',
    method: 'delete',
    data,
});

export const postVerifyEmail = () => ({
    url: 'core/v4/verify/email',
    method: 'post',
});

export const postVerifyPhone = () => ({
    url: 'core/v4/verify/phone',
    method: 'post',
});

export const reauthByEmailVerification = () => ({
    url: 'core/v4/verify/reauth/email',
    method: 'POST',
});

export const reauthBySmsVerification = () => ({
    url: 'core/v4/verify/reauth/phone',
    method: 'POST',
});
