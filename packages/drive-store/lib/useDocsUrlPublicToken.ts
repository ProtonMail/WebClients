import { getUrlPassword } from '../utils/url/password';

export function useDocsUrlPublicToken() {
    const searchParams = new URLSearchParams(window.location.search);

    const token = searchParams.get('token');
    const linkId = searchParams.get('linkId') || undefined;

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
        linkId,
    };
}
