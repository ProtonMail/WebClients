import type { FC } from 'react';

import { Field } from 'formik';
import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import Toggle from '@proton/components/components/toggle/Toggle';
import InputField from '@proton/components/components/v2/field/InputField';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import type { OrganizationUpdatePasswordPolicyRequest } from '@proton/pass/types';
import { oneOf } from '@proton/pass/utils/fp/predicates';
import clsx from '@proton/utils/clsx';

import type { PasswordGeneratorOptionValue, PasswordLength } from './PasswordGeneratorPolicyForm';

type Props = {
    id: keyof OrganizationUpdatePasswordPolicyRequest;
    label: string;
    value: PasswordGeneratorOptionValue;
    onChange: (value: PasswordGeneratorOptionValue) => void;
    length?: PasswordLength;
    disabled?: boolean;
    error?: string;
};

const getOptions = () => [
    { title: c('Option').t`Allowed (default)`, value: null },
    { title: c('Option').t`Not allowed`, value: false },
    { title: c('Option').t`Required`, value: true },
];

export const PasswordGeneratorPolicyOption: FC<Props> = ({ id, label, value, onChange, length, disabled, error }) => {
    return oneOf('RandomPasswordAllowed', 'MemorablePasswordAllowed')(id) ? (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor={`${id}-toggle`}>
                    <span className="text-semibold mr-1">{label}</span>
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <Toggle checked={value !== false} id={`${id}-toggle`} onChange={(e) => onChange(e.target.checked)} />
            </SettingsLayoutRight>
        </SettingsLayout>
    ) : (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor={`${id}-select`}>
                    <span className="text-semibold mr-1">{label}</span>
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                {length ? (
                    <Field
                        value={value}
                        as={InputField}
                        name={id}
                        type="number"
                        min={length.min}
                        max={length.max}
                        step={1}
                        disabled={disabled}
                        error={error}
                        assistContainerClassName={clsx(!error && 'hidden')}
                    />
                ) : (
                    <SelectTwo<PasswordGeneratorOptionValue>
                        placeholder={c('Option').t`Allowed (default)`}
                        value={value}
                        onChange={({ value }) => onChange(value)}
                        disabled={disabled}
                    >
                        {getOptions().map(({ title, value }) => (
                            <Option key={`${id}-${title}`} title={title} value={value} />
                        ))}
                    </SelectTwo>
                )}
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
