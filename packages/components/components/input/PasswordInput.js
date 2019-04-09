import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';

import Input from './Input';

const PasswordInput = ({ disabled, ...rest }) => {
    const [type, setType] = useState('password');
    const toggle = () => setType(type === 'password' ? 'text' : 'password');

    return (
        <>
            <Input disabled={disabled} type={type} {...rest} />
            <button disabled={disabled} type="button" onClick={toggle}>
                <Icon name={type === 'password' ? 'read' : 'unread'} />
            </button>
        </>
    );
};

PasswordInput.propTypes = {
    disabled: PropTypes.bool
};

export default PasswordInput;
