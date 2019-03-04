import React from 'react';
import PropTypes from 'prop-types';

import Input from './Input';

const Checkbox = ({ checked, ...rest }) => {
    return (
        <>
            <Input type="checkbox" className="pm-checkbox" checked={checked} {...rest} />
            <span className="pm-radio-fakecheckbox" />
        </>
    );
};

Checkbox.propTypes = {
    checked: PropTypes.bool.isRequired
};

export default Checkbox;
