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
            className="flex flex-items-center flex-nowrap p0-5 dropDown-logout-button"
        >
            {nameToDisplay ? (
                <span className="alignright flex flex-column mr0-75 lh130 nomobile">
                    <span className="inbl mw100 ellipsis dropDown-logout-displayName">{nameToDisplay}</span>
                    {Email ? (
                        <span className="inbl mw100 ellipsis m0 opacity-30 dropDown-logout-email">{Email}</span>
                    ) : null}
                </span>
            ) : (
                <span className="alignright flex flex-column mr0-75 lh130 nomobile">
                    <span className="inbl mw100 ellipsis dropDown-logout-displayName">{Email}</span>
                </span>
            )}
            <span className="mtauto mbauto semibold rounded p0-25 inbl dropDown-logout-initials relative flex flex-item-noshrink">
                <span className="dropDown-logout-text center">{initials}</span>
            </span>
        </button>
    );
};

export default UserDropdownButton;
