import React from 'react';
import PropTypes from 'prop-types';

const Footer = ({ children, className, ...rest }) => {
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

Footer.defaultProps = {
    className: 'flex flex-spacebetween'
};

export default Footer;
