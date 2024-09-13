import type { ButtonHTMLAttributes, DetailedHTMLProps, Ref } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import { NotificationDot } from '@proton/atoms';
import type { ThemeColor } from '@proton/colors';
import DropdownCaret from '@proton/components/components/dropdown/DropdownCaret';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import type { IconName } from '../..';

export interface Props extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    user: UserModel;
    className?: string;
    isOpen?: boolean;
    notification?: ThemeColor;
    dropdownIcon?: IconName;
}

const UserDropdownButton = (
    { user, isOpen, notification, dropdownIcon, ...rest }: Props,
    ref: Ref<HTMLButtonElement>
) => {
    const { Email, DisplayName, Name } = user;
    const nameToDisplay = DisplayName || Name || ''; // nameToDisplay can be falsy for external account
    // DisplayName is null for VPN users without any addresses, cast to undefined in case Name would be null too.
    const initials = getInitials(nameToDisplay || Email || '');
    const title = [nameToDisplay, `<${Email}>`].filter(isTruthy).join(' ');

    return (
        <button
            type="button"
            aria-expanded={isOpen}
            ref={ref}
            {...rest}
            className="max-w-full flex items-center flex-nowrap gap-3 user-dropdown-button relative interactive-pseudo-protrude rounded interactive--no-background"
            title={title}
        >
            <DropdownCaret className="md:hidden ml-1 color-weak" iconName={dropdownIcon} isOpen={isOpen} />

            {nameToDisplay ? (
                <span className="flex-1 lh130 user-dropdown-text">
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
                className="my-auto text-sm rounded border p-1 inline-block relative flex shrink-0 user-initials"
                aria-hidden="true"
            >
                <span className="m-auto">{initials}</span>
            </span>
            {notification && (
                <NotificationDot
                    color={notification}
                    className="absolute top-0 right-0 notification-dot--top-right"
                    alt={c('Info').t`Attention required`}
                />
            )}
        </button>
    );
};

export default forwardRef<HTMLButtonElement, Props>(UserDropdownButton);
