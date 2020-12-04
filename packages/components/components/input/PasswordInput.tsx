import React, { useState } from 'react';
import { c } from 'ttag';

import Icon from '../icon/Icon';
import Input, { Props } from './Input';

const PasswordInput = ({ disabled = false, ...rest }: Props) => {
    const [type, setType] = useState('password');
    const toggle = () => {
        setType(type === 'password' ? 'text' : 'password');
    };
    return (
        <Input
            type={type}
            disabled={disabled}
            icon={
                <button
                    title={type === 'password' ? c('Label').t`Reveal password` : c('Label').t`Hide password`}
                    className="inline-flex flex-item-noshrink"
                    tabIndex={-1}
                    disabled={disabled}
                    type="button"
                    onClick={toggle}
                >
                    <Icon className="mauto" name={type === 'password' ? 'read' : 'unread'} />
                </button>
            }
            {...rest}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
        />
    );
};

export default PasswordInput;
