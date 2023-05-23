import type { ChangeEvent, VFC } from 'react';

import type { FieldInputProps, FormikErrors } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { IconName } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import type { ExtraFieldType } from '@proton/pass/types';

import type { FieldBoxProps } from '../Layout/FieldBox';
import { FieldBox } from '../Layout/FieldBox';
import type { BaseTextFieldProps } from '../TextField';
import { BaseTextField } from '../TextField';
import type { ExtraFieldFormValue } from './ExtraFieldGroup';

type ExtraFieldOption = {
    icon: IconName;
    label: string;
    labelEdit: boolean;
    placeholder: string;
};

export type ExtraFieldProps = FieldBoxProps &
    Omit<BaseTextFieldProps, 'field' | 'placeholder' | 'error'> & {
        type: ExtraFieldType;
        field: FieldInputProps<ExtraFieldFormValue>;
        error?: FormikErrors<ExtraFieldFormValue>;
        onDelete: () => void;
    };

export const EXTRA_FIELD_OPTIONS: { [key in ExtraFieldType]: ExtraFieldOption } = {
    totp: {
        icon: 'lock',
        label: c('Label').t`2FA secret (TOTP)`,
        labelEdit: true,
        placeholder: c('Placeholder').t`Add 2FA secret`,
    },
    text: {
        icon: 'text-align-left',
        label: c('Label').t`Text`,
        labelEdit: true,
        placeholder: c('Placeholder').t`Add text`,
    },
    hidden: {
        icon: 'eye-slash',
        label: c('Label').t`Hidden`,
        labelEdit: true,
        placeholder: c('Placeholder').t`Add text`,
    },
};

const DeleteButton: VFC<{ onDelete: () => void }> = ({ onDelete }) => (
    <Button icon pill color="weak" onClick={onDelete} shape="solid" size="medium" title={c('Action').t`Delete`}>
        <Icon name="cross" size={20} />
    </Button>
);

export const ExtraFieldComponent: VFC<ExtraFieldProps> = (props) => {
    const { className, field, onDelete, type, error, ...rest } = props;
    const { icon, label, labelEdit, placeholder } = EXTRA_FIELD_OPTIONS[type];

    const getFieldFor = (input: keyof ExtraFieldFormValue) => ({
        ...field,
        value: field.value[input],
        onChange: (e: ChangeEvent<HTMLInputElement>) =>
            props.form.setFieldValue(field.name, { ...field.value, [input]: e.target.value }),
    });

    return (
        <FieldBox actions={[<DeleteButton onDelete={onDelete} />]} className={className} icon={icon}>
            {labelEdit && (
                <BaseTextField
                    className="field-two-label color-weak text-sm"
                    field={getFieldFor('fieldName')}
                    placeholder={label}
                    error={error?.fieldName}
                    {...rest}
                />
            )}
            <BaseTextField
                field={getFieldFor('value')}
                label={labelEdit ? undefined : label}
                placeholder={placeholder}
                error={error?.value}
                {...rest}
            />
        </FieldBox>
    );
};
