import { useState } from 'react';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';

import type { Props } from './Input';
import Input from './Input';

/**
 * @deprecated please use PasswordInputTwo instead
 */
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
                    className="inline-flex shrink-0"
                    tabIndex={-1}
                    disabled={disabled}
                    type="button"
                    onClick={toggle}
                >
                    <Icon className="m-auto" name={type === 'password' ? 'eye' : 'eye-slash'} />
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
