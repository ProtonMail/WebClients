export const validateEmail = (Email: string) => ({
    method: 'post',
    url: 'core/v4/validate/email',
    data: { Email },
});
