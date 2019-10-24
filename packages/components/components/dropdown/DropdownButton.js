import React from 'react';
import PropTypes from 'prop-types';
import DropdownCaret from './DropdownCaret';
import { classnames } from 'react-components';

const DropdownButton = ({
    buttonRef,
    className = 'pm-button',
    hasCaret = false,
    isOpen,
    children,
    caretClassName,
    disabled = false,
    loading = false,
    ...rest
}) => {
    return (
        <button
            ref={buttonRef}
            type="button"
            className={classnames(['flex-item-noshrink', className])}
            aria-expanded={isOpen}
            aria-busy={loading}
            disabled={loading ? true : disabled}
            {...rest}
        >
            <span className="mauto">
                <span className={classnames([hasCaret && children && 'mr0-5'])}>{children}</span>
                {hasCaret && <DropdownCaret className={caretClassName} isOpen={isOpen} />}
            </span>
        </button>
    );
};

DropdownButton.propTypes = {
    buttonRef: PropTypes.object,
    caretClassName: PropTypes.string,
    hasCaret: PropTypes.bool,
    isOpen: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    loading: PropTypes.bool
};

export default DropdownButton;
