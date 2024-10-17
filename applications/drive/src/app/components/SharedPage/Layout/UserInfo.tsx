import { Button } from '@proton/atoms/index';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { getUrlWithReturnUrl } from '@proton/shared/lib/helpers/url';
import type { UserModel } from '@proton/shared/lib/interfaces';

import usePublicToken from '../../../hooks/drive/usePublicToken';
import { RedirectionReason, drivePublicRedirectionReasonKey } from '../../../hooks/util/useRedirectToPublicPage';
import { saveUrlPasswordForRedirection } from '../../../utils/url/password';

import './UserInfo.scss';

export interface Props {
    user: UserModel;
}

// This is a partial copy of UserDropdownButton.
// We use this Component to show basic user info without the dropdown
export const UserInfo = ({ user }: Props) => {
    const { Email, DisplayName, Name } = user || {};
    const nameToDisplay = DisplayName || Name || ''; // nameToDisplay can be falsy for external account
    const initials = getInitials(nameToDisplay || Email || '');
    const { token, urlPassword } = usePublicToken();

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
        <Button
            onClick={() => {
                // Save password before going to account switch page
                saveUrlPasswordForRedirection(urlPassword);
                // We replace the url to prevent any bad action from the user,
                // like returning back into the history after signout all sessions
                replaceUrl(urlWithReturnUrl);
            }}
            className="user-info border-none max-w-full flex items-center flex-nowrap gap-3 user-info relative interactive-pseudo-protrude rounded interactive--no-background"
        >
            {nameToDisplay ? (
                <span className="flex-1 lh130 text-right hidden md:inline">
                    <span className="block text-ellipsis text-sm">{nameToDisplay}</span>
                    {Email ? (
                        <span className="block text-ellipsis color-weak text-sm m-0 lh-rg user-dropdown-email">
                            {Email}
                        </span>
                    ) : null}
                </span>
            ) : (
                <span className="lh130 text-right hidden md:inline">
                    <span className="block text-ellipsis">{Email}</span>
                </span>
            )}
            <span
                className="my-auto text-sm rounded border p-1 inline-block relative flex shrink-0 user-initials"
                aria-hidden="true"
            >
                <span className="m-auto">{initials}</span>
            </span>
        </Button>
    );
};
