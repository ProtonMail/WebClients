import type { FC } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import { usePasswordForm } from '@proton/pass/hooks/auth/usePasswordForm';
import type { Maybe, MaybePromise } from '@proton/pass/types';
import type { XorObfuscation } from '@proton/pass/utils/obfuscate/xor';

type Props = {
    autosavable?: boolean;
    disabled?: boolean;
    id: string;
    loading?: boolean;
    submitLabel?: string;
    onSubmit: (password: XorObfuscation) => MaybePromise<void>;
    onValidate?: (password: string) => Maybe<string>;
};

export const PasswordForm: FC<Props> = ({
    autosavable = false,
    disabled,
    id,
    loading,
    submitLabel,
    onSubmit,
    onValidate,
}) => {
    const { state, onValue, onFormSubmit } = usePasswordForm({ onSubmit, onValidate });
    const isDisabled = Boolean(!state.touched || state.error || disabled || loading);

    return (
        <Form id={id} onSubmit={onFormSubmit} {...(autosavable ? {} : { 'data-protonpass-autosave-ignore': true })}>
            <div className="flex flex-nowrap items-end w-full" style={{ '--border-radius-xl': '2em' }}>
                <InputFieldTwo
                    as={PasswordInputTwo}
                    autoComplete="current-password"
                    autoFocus={!disabled}
                    className="flex-1 rounded-xl overflow-hidden"
                    dense
                    disabled={disabled || loading}
                    error={state.touched ? state.error : undefined}
                    inputClassName="text-rg rounded-none"
                    name="password"
                    required
                    rootClassName="flex-1"
                    onValue={onValue}
                />
            </div>
            <Button
                pill
                shape="solid"
                color="norm"
                className="w-full"
                type="submit"
                loading={loading}
                disabled={isDisabled}
            >
                {submitLabel}
            </Button>
        </Form>
    );
};
