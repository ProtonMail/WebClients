import React from 'react';
import PropTypes from 'prop-types';
import DropdownCaret from './DropdownCaret';
import { classnames } from 'react-components';

const DropdownButton = ({ buttonRef, className = 'pm-button', hasCaret = false, isOpen, children, ...rest }) => {
    return (
        <button
            ref={buttonRef}
            type="button"
            className={classnames(['flex-item-noshrink', className])}
            aria-expanded={isOpen}
            {...rest}
        >
            <span className="mauto">
                <span className={classnames([hasCaret && children && 'mr0-5'])}>{children}</span>
                {hasCaret && <DropdownCaret isOpen={isOpen} />}
            </span>
        </button>
    );
};

DropdownButton.propTypes = {
    buttonRef: PropTypes.object,
    hasCaret: PropTypes.bool,
    isOpen: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string
};

export default DropdownButton;
