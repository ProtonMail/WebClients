import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers';

const Footer = ({
    children,
    className = 'flex flex-justify-space-between flex-align-items-center flex-nowrap',
    ...rest
}) => {
    return (
        <footer className={classnames(['modal-footer', className])} {...rest}>
            {children}
        </footer>
    );
};

Footer.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

export default Footer;
