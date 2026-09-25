import type { ReactNode } from 'react';

import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';

export const PasswordField = ({
    label,
    value,
    onValue,
    error,
    disabled,
    autoFocus,
    onChange,
}: {
    label: string;
    value: string;
    onValue: (value: string) => void;
    error: ReactNode | boolean;
    disabled: boolean;
    autoFocus?: boolean;
    onChange: () => void;
}) => (
    <InputFieldTwo
        id="password"
        bigger
        label={label}
        error={error}
        as={PasswordInputTwo}
        disableChange={disabled}
        autoComplete="current-password"
        autoFocus={autoFocus}
        value={value}
        onValue={onValue}
        rootClassName="mt-2"
        onChange={onChange}
    />
);
