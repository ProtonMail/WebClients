import type { Ref } from 'react';
import { forwardRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { InputProps } from '@proton/atoms/Input/Input';
import { Input } from '@proton/atoms/Input/Input';
import Icon from '@proton/components/components/icon/Icon';

type PasswordType = 'password' | 'text';

interface Props extends Omit<InputProps, 'type'> {
    defaultType?: PasswordType;
}

const PasswordInputTwoBase = (
    { disabled, suffix, defaultType = 'password', ...rest }: Props,
    ref: Ref<HTMLInputElement>
) => {
    const [type, setType] = useState<PasswordType>(defaultType);
    const toggle = () => {
        setType(type === 'password' ? 'text' : 'password');
    };
    return (
        <Input
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            {...rest}
            ref={ref}
            type={type}
            disabled={disabled}
            suffix={
                <>
                    {suffix}
                    <Button
                        title={type === 'password' ? c('Label').t`Reveal password` : c('Label').t`Hide password`}
                        className="inline-flex shrink-0"
                        tabIndex={-1}
                        disabled={disabled}
                        onClick={toggle}
                        shape="ghost"
                        size="small"
                        icon
                    >
                        <Icon className="m-auto" name={type === 'password' ? 'eye' : 'eye-slash'} />
                    </Button>
                </>
            }
        />
    );
};

const PasswordInputTwo = forwardRef(PasswordInputTwoBase);

export default PasswordInputTwo;
