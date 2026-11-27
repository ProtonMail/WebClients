export const validateEmail = (Email: string) => ({
    method: 'post',
    url: 'core/v4/validate/email',
    data: { Email },
});

export const validatePhone = (Phone: string) => ({
    method: 'post',
    url: 'core/v4/validate/phone',
    data: { Phone },
});
