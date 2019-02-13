import React from 'react';
import PropTypes from 'prop-types';
import { t } from 'ttag';

import Button from '../button/Button';
import { getClasses } from '../../helpers/component';

const Header = ({ children, modalTitleID, className, hasClose, onClose, ...rest }) => {
    return (
        <header className={getClasses('pm-modalHeader', className)} {...rest}>
            {hasClose ? <Button className="pm-modalClose" title={t`Close`} onClick={onClose}>x</Button> : null}
            <h1 id={modalTitleID} className="pm-modalTitle">{children}</h1>
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
    modalTitleID: 'modalTitle'
};

export default Header;