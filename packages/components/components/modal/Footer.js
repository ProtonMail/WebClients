import React from 'react';
import PropTypes from 'prop-types';

const Footer = ({ children, className = 'flex flex-spacebetween', ...rest }) => {
    return (
        <footer className={`pm-modalFooter ${className}`} {...rest}>
            {children}
        </footer>
    );
};

Footer.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export default Footer;
