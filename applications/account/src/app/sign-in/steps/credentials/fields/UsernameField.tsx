import type { ReactNode, Ref } from 'react';

import InputFieldTwo from '@proton/components/components/v2/field/InputField';

export const UsernameField = ({
    label,
    value,
    onValue,
    error,
    disabled,
    readOnly,
    inputRef,
    onChange,
}: {
    label: string;
    value: string;
    onValue: (value: string) => void;
    error: ReactNode | boolean;
    disabled: boolean;
    readOnly?: boolean;
    inputRef: Ref<HTMLInputElement>;
    onChange: () => void;
}) => (
    <InputFieldTwo
        id="username"
        bigger
        autoFocus
        label={label}
        error={error}
        disableChange={disabled}
        autoComplete="username"
        value={value}
        onValue={onValue}
        ref={inputRef}
        onChange={onChange}
        readOnly={readOnly}
    />
);
