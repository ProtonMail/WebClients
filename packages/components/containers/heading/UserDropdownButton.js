import React from 'react';
import PropTypes from 'prop-types';
import { DropdownCaret } from 'react-components';
import { getInitial } from 'proton-shared/lib/helpers/string';

const UserDropdownButton = ({ user, isOpen, buttonRef, ...rest }) => {
    const { Email, DisplayName, Name } = user;
    // DisplayName is null for VPN users without any addresses, cast to undefined in case Name would be null too.
    const initials = getInitial(DisplayName || Name || undefined);

    return (
        <button
            type="button"
            className="color-white inline-flex dropDown-logout-button"
            aria-expanded={isOpen}
            ref={buttonRef}
            {...rest}
        >
            <span className="alignright mr0-5">
                <span className="bl capitalize">{DisplayName}</span>
                {Email ? <span className="bl smaller m0 opacity-30 lh100">{Email}</span> : null}
            </span>

            <span className="mtauto mbauto bordered rounded50 p0-5 inbl dropDown-logout-initials relative">
                <span className="dropDown-logout-text center">{initials}</span>
                <DropdownCaret isOpen={isOpen} className="icon-12p expand-caret mauto" />
            </span>
        </button>
    );
};

UserDropdownButton.propTypes = {
    user: PropTypes.object,
    className: PropTypes.string,
    isOpen: PropTypes.bool,
    buttonRef: PropTypes.object
};

export default UserDropdownButton;
