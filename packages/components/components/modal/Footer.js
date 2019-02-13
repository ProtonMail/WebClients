import React from 'react';
import PropTypes from 'prop-types';

import { getClasses } from '../../helpers/component';

const Footer = ({ children, className, ...rest }) => {
    return <footer className={getClasses('pm-modalFooter', className)} {...rest}>{children}</footer>;
};

Footer.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export default Footer;