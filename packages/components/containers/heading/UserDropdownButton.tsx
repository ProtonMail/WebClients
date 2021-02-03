import React, { Ref } from 'react';
import { UserModel } from 'proton-shared/lib/interfaces';
import { getInitial } from 'proton-shared/lib/helpers/string';

interface Props extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    user: UserModel;
    className?: string;
    isOpen?: boolean;
    buttonRef?: Ref<HTMLButtonElement>;
}

const UserDropdownButton = ({ user, isOpen, buttonRef, ...rest }: Props) => {
    const { Email, DisplayName, Name } = user;
    const nameToDisplay = DisplayName || Name; // nameToDisplay can be falsy for external account
    // DisplayName is null for VPN users without any addresses, cast to undefined in case Name would be null too.
    const initials = getInitial(nameToDisplay || Email || '');

    return (
        <button
            type="button"
            aria-expanded={isOpen}
            ref={buttonRef}
            {...rest}
            className="flex flex-align-items-center flex-nowrap p0-5 dropdown-logout-button"
        >
            {nameToDisplay ? (
                <span className="text-right flex flex-column mr0-75 lh130 no-mobile">
                    <span className="inline-block max-w100 text-ellipsis dropdown-logout-displayName">
                        {nameToDisplay}
                    </span>
                    {Email ? (
                        <span className="inline-block max-w100 text-ellipsis m0 opacity-30 dropdown-logout-email">
                            {Email}
                        </span>
                    ) : null}
                </span>
            ) : (
                <span className="text-right flex flex-column mr0-75 lh130 no-mobile">
                    <span className="inline-block max-w100 text-ellipsis dropdown-logout-displayName">{Email}</span>
                </span>
            )}
            <span className="mtauto mbauto text-semibold rounded p0-25 inline-block dropdown-logout-initials relative flex flex-item-noshrink">
                <span className="dropdown-logout-text center">{initials}</span>
            </span>
        </button>
    );
};

export default UserDropdownButton;
