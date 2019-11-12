import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Icon } from 'react-components';
import { classnames } from '../../helpers/component';

const Header = ({ children, modalTitleID, className = '', hasClose = true, onClose, ...rest }) => {
    return (
        <header className={classnames(['pm-modalHeader', className])} {...rest}>
            {hasClose ? (
                <button type="button" className="pm-modalClose" title={c('Action').t`Close modal`} onClick={onClose}>
                    <Icon className="pm-modalClose-icon" name="close" />
                    <span className="sr-only">{c('Action').t`Close modal`}</span>
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

export default Header;
