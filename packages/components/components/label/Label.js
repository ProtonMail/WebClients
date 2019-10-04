import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';

const Label = ({ htmlFor, className = '', children, ...rest }) => {
    return (
        <label htmlFor={htmlFor} className={classnames(['pm-label', className])} {...rest}>
            {children}
        </label>
    );
};

Label.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
    htmlFor: PropTypes.string
};

export default Label;
