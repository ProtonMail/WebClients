import { useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { replaceUrl } from '@proton/shared/lib/helpers/browser';

import { getSharedLink } from '../../store/_shares';
import { deleteStoredUrlPassword, getUrlPassword } from '../../utils/url/password';

export const drivePublicRedirectionReasonKey = 'drivePublicRedirectionReason';
export enum RedirectionReason {
    ACCOUNT_SWITCH = 'accountSwitch',
    SIGNIN = 'signin',
}
export const useRedirectToPublicPage = () => {
    const location = useLocation();
    const history = useHistory();

    const redirectionReason = useMemo(() => {
        const urlSearchParams = new URLSearchParams(location.search);
        const redirectionReasonParams = urlSearchParams.get(drivePublicRedirectionReasonKey);
        return redirectionReasonParams === RedirectionReason.ACCOUNT_SWITCH ||
            redirectionReasonParams === RedirectionReason.SIGNIN
            ? redirectionReasonParams
            : undefined;
    }, [location]);

    const cleanupUrl = () => {
        const newUrlSearchParams = new URLSearchParams(location.search);
        newUrlSearchParams.delete(drivePublicRedirectionReasonKey);
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

    return { redirectionReason, redirectToPublicPage, cleanupUrl };
};
