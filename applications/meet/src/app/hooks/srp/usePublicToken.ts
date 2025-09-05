export const getUrlPassword = () => {
    const hash = window.location.hash;

    const password = hash.replace('#pwd-', '');

    return password;
};

export const getPublicToken = () => {
    const pathname = window.location.pathname;

    const potentialId = pathname.split('/').at(-1);

    const token = potentialId?.includes('id-') ? (potentialId?.replace('id-', '') as string) : '';

    return token;
};
