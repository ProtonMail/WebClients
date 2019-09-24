import React from 'react';
import PropTypes from 'prop-types';
import { Icon, DropdownCaret } from 'react-components';
import { c } from 'ttag';

const SupportDropdownButton = ({ isOpen, buttonRef, ...rest }) => {
    return (
        <button
            type="button"
            className="topnav-link inline-flex flex-nowrap nodecoration rounded"
            aria-expanded={isOpen}
            ref={buttonRef}
            {...rest}
        >
            <Icon name="support1" className="flex-item-noshrink topnav-icon mr0-5 flex-item-centered-vert fill-white" />
            <span className="navigation-title topnav-linkText mr0-5">{c('Header').t`Support`}</span>
            <DropdownCaret isOpen={isOpen} className="expand-caret topnav-icon mtauto mbauto" />
        </button>
    );
};

SupportDropdownButton.propTypes = {
    isOpen: PropTypes.bool,
    buttonRef: PropTypes.object
};

export default SupportDropdownButton;
