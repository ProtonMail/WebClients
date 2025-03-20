import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';

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
    const navigate = useNavigate();

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
        navigate(
            {
                search: newUrlSearchParams.toString(),
            },
            { replace: true }
        );
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
