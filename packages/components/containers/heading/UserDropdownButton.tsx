import { ButtonHTMLAttributes, DetailedHTMLProps, Ref, forwardRef } from 'react';

import { c } from 'ttag';

import { NotificationDot } from '@proton/atoms';
import { ThemeColor } from '@proton/colors';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { UserModel } from '@proton/shared/lib/interfaces';

import { DropdownCaret } from '../..';

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
            className="max-w-full flex flex-align-items-center flex-nowrap gap-3 user-dropdown-button relative interactive-pseudo-protrude rounded interactive--no-background"
            title={`${nameToDisplay} <${Email}>`}
        >
            <DropdownCaret className="md:hidden ml-1 color-weak" isOpen={isOpen} />

            {nameToDisplay ? (
                <span className="flex-item-fluid lh130 user-dropdown-text">
                    <span className="block text-ellipsis text-sm user-dropdown-displayName">{nameToDisplay}</span>
                    {Email ? (
                        <span className="block text-ellipsis color-weak text-sm m-0 lh-rg user-dropdown-email">
                            {Email}
                        </span>
                    ) : null}
                </span>
            ) : (
                <span className="lh130 user-dropdown-text">
                    <span className="block text-ellipsis user-dropdown-displayName">{Email}</span>
                </span>
            )}
            <span
                className="my-auto text-sm rounded border p-1 inline-block relative flex flex-item-noshrink user-initials"
                aria-hidden="true"
            >
                <span className="m-auto">{initials}</span>
            </span>
            {notification && (
                <NotificationDot
                    color={notification}
                    className="absolute top right notification-dot--top-right"
                    alt={c('Info').t`Attention required`}
                />
            )}
        </button>
    );
};

export default forwardRef<HTMLButtonElement, Props>(UserDropdownButton);
