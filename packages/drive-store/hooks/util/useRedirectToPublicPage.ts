import { useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { replaceUrl } from '@proton/shared/lib/helpers/browser';

import { getSharedLink } from '../../store/_shares';
import { deleteStoredUrlPassword, getUrlPassword } from '../../utils/url/password';

const redirectToPublicKey = 'redirectToPublic';

export const useRedirectToPublicPage = () => {
    const location = useLocation();
    const history = useHistory();

    const needToRedirectToPublicPage = useMemo(() => {
        const urlSearchParams = new URLSearchParams(location.search);
        const redirectToPublic = urlSearchParams.get(redirectToPublicKey);
        return redirectToPublic === 'true';
    }, [location]);

    const cleanupUrl = () => {
        const newUrlSearchParams = new URLSearchParams(location.search);
        newUrlSearchParams.delete(redirectToPublicKey);
        newUrlSearchParams.delete('token');
        deleteStoredUrlPassword();
        history.replace({
            search: newUrlSearchParams.toString(),
        });
    };

    const redirectToPublicPage = (token: string) => {
        const urlPassword = getUrlPassword({ readOnly: true, filterCustom: true });
        if (!urlPassword) {
            cleanupUrl();
            return;
        }

        const url = getSharedLink({ token, password: urlPassword });
        if (!url) {
            cleanupUrl();
            return;
        }
        replaceUrl(url);
    };

    return { needToRedirectToPublicPage, redirectToPublicPage, cleanupUrl };
};
