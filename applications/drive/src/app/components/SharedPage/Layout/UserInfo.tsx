import { getInitials } from '@proton/shared/lib/helpers/string';
import type { UserModel } from '@proton/shared/lib/interfaces';

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

    return (
        <div className="max-w-full flex items-center flex-nowrap gap-3 user-info relative interactive-pseudo-protrude rounded interactive--no-background">
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
        </div>
    );
};
