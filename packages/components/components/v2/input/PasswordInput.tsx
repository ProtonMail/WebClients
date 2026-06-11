import type { Ref } from 'react';
import { forwardRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { InputProps } from '@proton/atoms/Input/Input';
import { Input } from '@proton/atoms/Input/Input';
import { IcEye } from '@proton/icons/icons/IcEye';
import { IcEyeSlash } from '@proton/icons/icons/IcEyeSlash';

type PasswordType = 'password' | 'text';

export interface PasswordInputTwoProps extends Omit<InputProps, 'type'> {
    defaultType?: PasswordType;
}

const PasswordInputTwoBase = (
    { disabled, suffix, defaultType = 'password', ...rest }: PasswordInputTwoProps,
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
                        {type === 'password' ? <IcEye className="m-auto" /> : <IcEyeSlash className="m-auto" />}
                    </Button>
                </>
            }
        />
    );
};

const PasswordInputTwo = forwardRef(PasswordInputTwoBase);

export default PasswordInputTwo;
