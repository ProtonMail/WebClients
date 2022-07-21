import { useState } from 'react';
import { c } from 'ttag';
import { Button } from '../../button';

import Icon from '../../icon/Icon';
import InputTwo, { InputTwoProps } from './Input';

type PasswordType = 'password' | 'text';

interface Props extends Omit<InputTwoProps, 'type'> {
    defaultType?: PasswordType;
}

const PasswordInputTwo = ({ disabled, suffix, defaultType = 'password', ...rest }: Props) => {
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
                <>
                    {suffix}
                    <Button
                        title={type === 'password' ? c('Label').t`Reveal password` : c('Label').t`Hide password`}
                        className="inline-flex flex-item-noshrink"
                        tabIndex={-1}
                        disabled={disabled}
                        onClick={toggle}
                        shape="ghost"
                        size="small"
                        icon
                    >
                        <Icon className="mauto" name={type === 'password' ? 'eye' : 'eye-slash'} />
                    </Button>
                </>
            }
        />
    );
};

export default PasswordInputTwo;
