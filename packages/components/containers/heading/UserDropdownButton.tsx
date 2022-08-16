import { ButtonHTMLAttributes, DetailedHTMLProps, Ref, forwardRef } from 'react';

import { NotificationDot } from '@proton/atoms';
import { ThemeColor } from '@proton/colors';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { UserModel } from '@proton/shared/lib/interfaces';

export interface Props extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    user: UserModel;
    className?: string;
    isOpen?: boolean;
    notification?: ThemeColor;
}

const UserDropdownButton = ({ user, isOpen, notification, ...rest }: Props, ref: Ref<HTMLButtonElement>) => {
    const { Email, DisplayName, Name } = user;
    const nameToDisplay = DisplayName || Name; // nameToDisplay can be falsy for external account
    // DisplayName is null for VPN users without any addresses, cast to undefined in case Name would be null too.
    const initials = getInitials(nameToDisplay || Email || '');

    return (
        <button
            type="button"
            aria-expanded={isOpen}
            ref={ref}
            {...rest}
            className="max-w100 flex flex-align-items-center flex-nowrap user-dropdown-button relative"
            title={`${nameToDisplay} <${Email}>`}
        >
            {nameToDisplay ? (
                <span className="text-right flex-item-fluid mr0-75 lh130 user-dropdown-text">
                    <span className="block text-ellipsis user-dropdown-displayName">{nameToDisplay}</span>
                    {Email ? (
                        <span className="block text-ellipsis color-weak text-xs m0 lh-rg user-dropdown-email">
                            {Email}
                        </span>
                    ) : null}
                </span>
            ) : (
                <span className="text-right mr0-75 lh130 user-dropdown-text">
                    <span className="block text-ellipsis user-dropdown-displayName">{Email}</span>
                </span>
            )}
            <span
                className="myauto text-sm rounded border p0-25 inline-block relative flex flex-item-noshrink user-initials"
                aria-hidden="true"
            >
                <span className="mauto">{initials}</span>
            </span>
            {notification && (
                <NotificationDot color={notification} className="absolute top right notification-dot--top-right" />
            )}
        </button>
    );
};

export default forwardRef<HTMLButtonElement, Props>(UserDropdownButton);
