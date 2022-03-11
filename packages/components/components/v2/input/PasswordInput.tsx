import { useState } from 'react';
import { c } from 'ttag';

import Icon from '../../icon/Icon';
import InputTwo, { InputTwoProps } from './Input';

type PasswordType = 'password' | 'text';

interface Props extends Omit<InputTwoProps, 'type'> {
    defaultType?: PasswordType;
}

const PasswordInputTwo = ({ disabled, defaultType = 'password', ...rest }: Props) => {
    const [type, setType] = useState<PasswordType>(defaultType);
    const toggle = () => {
        setType(type === 'password' ? 'text' : 'password');
    };
    return (
        <InputTwo
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            {...rest}
            type={type}
            disabled={disabled}
            suffix={
                <button
                    title={type === 'password' ? c('Label').t`Reveal password` : c('Label').t`Hide password`}
                    className="inline-flex flex-item-noshrink"
                    tabIndex={-1}
                    disabled={disabled}
                    type="button"
                    onClick={toggle}
                >
                    <Icon className="mauto" name={type === 'password' ? 'eye' : 'eye-slash'} />
                </button>
            }
        />
    );
};

export default PasswordInputTwo;
