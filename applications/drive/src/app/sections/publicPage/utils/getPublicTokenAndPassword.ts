import { getUrlPassword } from '../../../utils/url/password';

export const getPublicTokenAndPassword = (pathname: string) => {
    const token = pathname.includes('/urls/') ? pathname.replace('/urls/', '').split('#')[0] : '';
    const urlPassword = getUrlPassword();
    return {
        token,
        urlPassword,
    };
};
