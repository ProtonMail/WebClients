import React from 'react';
import PropTypes from 'prop-types';

import { getClasses } from '../../helpers/component';

const Select = ({ options, className, ...rest }) => {
    return (
        <select className={getClasses('pm-field', className)} {...rest}>
            {options.map(({ text, ...rest }, index) => <option key={index.toString()} {...rest}>{text}</option>)}
        </select>
    );
};

Select.propTypes = {
    options: PropTypes.arrayOf(PropTypes.object).isRequired,
    multiple: PropTypes.bool,
    className: PropTypes.string
};

Select.defaultProps = {
    multiple: false
};

export default Select;