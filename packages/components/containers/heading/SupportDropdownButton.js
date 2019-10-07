import React from 'react';
import PropTypes from 'prop-types';
import { Icon, DropdownCaret } from 'react-components';
import { c } from 'ttag';

const SupportDropdownButton = ({ content = c('Header').t`Support`, className, isOpen, buttonRef, ...rest }) => {
    return (
        <button type="button" className={className} aria-expanded={isOpen} ref={buttonRef} {...rest}>
            <Icon name="support1" className="flex-item-noshrink topnav-icon mr0-5 flex-item-centered-vert" />
            <span className="navigation-title topnav-linkText mr0-5">{content}</span>
            <DropdownCaret isOpen={isOpen} className="expand-caret topnav-icon mtauto mbauto" />
        </button>
    );
};

SupportDropdownButton.propTypes = {
    content: PropTypes.string,
    className: PropTypes.string,
    isOpen: PropTypes.bool,
    buttonRef: PropTypes.object
};

export default SupportDropdownButton;
