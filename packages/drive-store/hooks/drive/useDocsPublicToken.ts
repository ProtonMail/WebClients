import { getUrlPassword } from '../../utils/url/password';

export function useDocsPublicToken() {
    const searchParams = new URLSearchParams(window.location.search);

    const token = searchParams.get('token');
    const linkId = searchParams.get('linkId');

    const urlPassword = getUrlPassword();

    if (!token) {
        throw new Error('No token found');
    }

    if (!linkId) {
        throw new Error('No linkId found');
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
