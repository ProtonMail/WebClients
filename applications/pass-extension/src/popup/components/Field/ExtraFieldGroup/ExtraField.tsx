import type { ChangeEvent, VFC } from 'react';

import type { FieldInputProps, FormikErrors } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { IconName } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import type { ExtraFieldType, ItemExtraField } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import type { FieldBoxProps } from '../Layout/FieldBox';
import { FieldBox } from '../Layout/FieldBox';
import type { BaseTextFieldProps } from '../TextField';
import { BaseTextField } from '../TextField';

// import type { ExtraFieldFormValue } from './ExtraFieldGroup';

type ExtraFieldOption = {
    icon: IconName;
    label: string;
    placeholder: string;
};

export type ExtraFieldProps = FieldBoxProps &
    Omit<BaseTextFieldProps, 'field' | 'placeholder' | 'error'> & {
        type: ExtraFieldType;
        field: FieldInputProps<ItemExtraField>;
        error?: FormikErrors<ItemExtraField>;
        onDelete: () => void;
    };

export const getExtraFieldOptions = (): { [key in ExtraFieldType]: ExtraFieldOption } => ({
    totp: {
        icon: 'lock',
        label: c('Label').t`2FA secret (TOTP)`,
        placeholder: c('Placeholder').t`Add 2FA secret`,
    },
    text: {
        icon: 'text-align-left',
        label: c('Label').t`Text`,
        placeholder: c('Placeholder').t`Add text`,
    },
    hidden: {
        icon: 'eye-slash',
        label: c('Label').t`Hidden`,
        placeholder: c('Placeholder').t`Add hidden text`,
    },
});

const DeleteButton: VFC<{ onDelete: () => void }> = ({ onDelete }) => (
    <Button icon pill color="weak" onClick={onDelete} shape="solid" size="medium" title={c('Action').t`Delete`}>
        <Icon name="cross" size={20} />
    </Button>
);

export const ExtraFieldComponent: VFC<ExtraFieldProps> = (props) => {
    const { className, field, onDelete, type, error, ...rest } = props;
    const { icon, placeholder } = getExtraFieldOptions()[type];

    const getFieldFor = (input: keyof ItemExtraField) => ({
        ...field,
        value: field.value[input],
        onChange: (e: ChangeEvent<HTMLInputElement>) =>
            props.form.setFieldValue(field.name, { ...field.value, [input]: e.target.value }),
    });

    return (
        <FieldBox actions={[<DeleteButton onDelete={onDelete} />]} className={className} icon={icon}>
            <BaseTextField
                autoFocus={true}
                className="field-two-label color-weak text-sm"
                field={getFieldFor('fieldName')}
                inputClassName={clsx(error?.fieldName && 'placeholder-danger')}
                placeholder={c('Label').t`Label`}
                {...rest}
            />
            <BaseTextField
                field={getFieldFor('value')}
                placeholder={placeholder}
                error={error?.fieldName || error?.value}
                {...rest}
            />
        </FieldBox>
    );
};
