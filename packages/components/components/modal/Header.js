import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

const Header = ({ children, modalTitleID, className, hasClose, onClose, ...rest }) => {
    return (
        <header className={`pm-modalHeader ${className}`} {...rest}>
            {hasClose ? (
                <button type="button" className="pm-modalClose" title={c('Action').t`Close modal`} onClick={onClose}>
                    ×
                </button>
            ) : null}
            <h1 id={modalTitleID} className="pm-modalTitle">
                {children}
            </h1>
        </header>
    );
};

Header.propTypes = {
    children: PropTypes.node.isRequired,
    hasClose: PropTypes.bool,
    onClose: PropTypes.func,
    className: PropTypes.string,
    modalTitleID: PropTypes.string.isRequired
};

Header.defaultProps = {
    hasClose: true,
    modalTitleID: 'modalTitle',
    className: ''
};

export default Header;
