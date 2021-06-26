import React from 'react';
import { UserModel } from 'proton-shared/lib/interfaces';
import { getInitials } from 'proton-shared/lib/helpers/string';

export interface Props
    extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    user: UserModel;
    className?: string;
    isOpen?: boolean;
}

const UserDropdownButton = ({ user, isOpen, ...rest }: Props, ref: React.Ref<HTMLButtonElement>) => {
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
            className="max-w100 flex flex-align-items-center flex-nowrap user-dropdown-button"
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
            <span className="mtauto mbauto text-semibold rounded bordered p0-25 inline-block user-initials relative flex flex-item-noshrink">
                <span className="mtauto mbauto center">{initials}</span>
            </span>
        </button>
    );
};

export default React.forwardRef<HTMLButtonElement, Props>(UserDropdownButton);
