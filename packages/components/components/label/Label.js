import React from 'react';
import PropTypes from 'prop-types';
import { getClasses } from '../../helpers/component';

const Label = ({ htmlFor, className, children, ...rest }) => {
    return <label htmlFor={htmlFor} className={getClasses('pm-label', className)} {...rest}>{children}</label>;
};

Label.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
    htmlFor: PropTypes.string
};

export default Label;