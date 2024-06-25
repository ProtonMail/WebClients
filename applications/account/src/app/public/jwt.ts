export const stripQueryParams = (value: string | null = '') => {
    if (!value) {
        return '';
    }
    // Safari opens a url as e.g. proton.me/verify#{token}?safariOpen=1
    return value.replace(/\?.*/, '');
};
