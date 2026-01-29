import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { getUrlWithReturnUrl } from '@proton/shared/lib/helpers/url';

import { RedirectionReason, drivePublicRedirectionReasonKey } from '../../hooks/util/useRedirectToPublicPage';
import { saveUrlPasswordForRedirection } from '../../utils/url/password';
import type { UserAddress } from './usePublicAuth.store';
import { getPublicTokenAndPassword } from './utils/getPublicTokenAndPassword';

interface Props {
    userAddress: UserAddress;
}

export const UserInfo = ({ userAddress }: Props) => {
    const initials = getInitials(userAddress.displayName || userAddress.email || '');
    const { token, urlPassword } = getPublicTokenAndPassword(window.location.pathname);

    const accountSwitchUrl = new URL(getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT));
    accountSwitchUrl.searchParams.append('product', 'drive');
    const returnUrlSearchParams = new URLSearchParams();
    returnUrlSearchParams.append('token', token);
    // We need to pass by the private app to set latest active session, then be redirected to public page.
    // This will be done in MainContainer.tsx on page loading
    returnUrlSearchParams.append(drivePublicRedirectionReasonKey, RedirectionReason.ACCOUNT_SWITCH);
    const returnUrl = `/?`.concat(returnUrlSearchParams.toString());
    const urlWithReturnUrl = getUrlWithReturnUrl(accountSwitchUrl.toString(), {
        returnUrl: returnUrl,
        context: 'private',
    });

    return (
        <Tooltip
            title={
                <div className="flex flex-column">
                    <span>{userAddress.displayName}</span>
                    <span>{userAddress.email}</span>
                </div>
            }
        >
            <Button
                onClick={() => {
                    // Save password before going to account switch page
                    saveUrlPasswordForRedirection(urlPassword);
                    document.location.assign(urlWithReturnUrl);
                }}
                className="ratio-square h-custom p-0"
                style={{
                    '--h-custom': '2.25rem',
                }}
            >
                {initials}
            </Button>
        </Tooltip>
    );
};
