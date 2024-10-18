import { getUrlPassword } from '../../utils/url/password';

export function useDocsPublicToken() {
    const token = new URLSearchParams(window.location.search).get('token');
    const urlPassword = getUrlPassword();

    if (!token) {
        throw new Error('No token found');
    }

    if (!urlPassword) {
        throw new Error('No url password found');
    }

    return {
        token,
        urlPassword,
    };
}
