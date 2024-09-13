import type { ChangeEvent, FC } from 'react';

import type { FieldInputProps, FormikErrors } from 'formik';
import { c } from 'ttag';

import { Button, type ButtonProps } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';
import type { ExtraFieldType, UnsafeItemExtraField } from '@proton/pass/types';
import { partialMerge } from '@proton/pass/utils/object/merge';
import clsx from '@proton/utils/clsx';

import type { FieldBoxProps } from '../Layout/FieldBox';
import { FieldBox } from '../Layout/FieldBox';
import type { BaseTextFieldProps } from '../TextField';
import { BaseTextField } from '../TextField';
import type { BaseTextAreaFieldProps } from '../TextareaField';
import { BaseMaskedTextAreaField, BaseTextAreaField } from '../TextareaField';

type ExtraFieldOption = {
    icon: IconName;
    label: string;
    placeholder: string;
};

type ExtraFieldError<T extends ExtraFieldType> = FormikErrors<UnsafeItemExtraField<T>>;

export type ExtraFieldProps = FieldBoxProps &
    Omit<BaseTextFieldProps & BaseTextAreaFieldProps, 'field' | 'placeholder' | 'error'> & {
        type: ExtraFieldType;
        field: FieldInputProps<UnsafeItemExtraField>;
        error?: ExtraFieldError<ExtraFieldType>;
        touched?: boolean;
        showIcon?: boolean;
        autoFocus?: boolean;
        onDelete: () => void;
    };

export const getExtraFieldOptions = (): Record<ExtraFieldType, ExtraFieldOption> => ({
    text: {
        icon: 'text-align-left',
        label: c('Label').t`Text`,
        placeholder: c('Placeholder').t`Add text`,
    },
    totp: {
        icon: 'lock',
        label: c('Label').t`2FA secret key (TOTP)`,
        placeholder: c('Placeholder').t`Add 2FA secret key`,
    },
    hidden: {
        icon: 'eye-slash',
        // translator: label for a field that is hidden. Singular only.
        label: c('Label').t`Hidden`,
        placeholder: c('Placeholder').t`Add hidden text`,
    },
});

export const getExtraFieldOption = (type: ExtraFieldType) => getExtraFieldOptions()[type];

type DeleteButtonProps = ButtonProps & { onDelete: () => void };
export const DeleteButton: FC<DeleteButtonProps> = ({ onDelete, size = 'medium' }) => (
    <Button icon pill color="weak" onClick={onDelete} shape="solid" size={size} title={c('Action').t`Delete`}>
        <Icon name="cross" size={5} />
    </Button>
);

export const ExtraFieldComponent: FC<ExtraFieldProps> = ({
    autoFocus,
    className,
    error,
    field,
    onDelete,
    showIcon = true,
    touched,
    type,
    ...rest
}) => {
    const { icon, placeholder } = getExtraFieldOption(type);

    const onChangeHandler =
        (merge: (evt: ChangeEvent<HTMLInputElement>, field: UnsafeItemExtraField) => UnsafeItemExtraField) =>
        (evt: ChangeEvent<HTMLInputElement>) => {
            void rest.form.setFieldValue(field.name, merge(evt, field.value));
        };

    const fieldValueEmpty = Object.values(field.value.data).every((value) => !value);

    return (
        <FieldBox
            actions={[<DeleteButton onDelete={onDelete} />]}
            className={className}
            icon={showIcon ? icon : undefined}
        >
            <BaseTextField
                inputClassName={clsx(
                    'text-sm',
                    !fieldValueEmpty && 'color-weak',
                    touched && error?.fieldName && 'placeholder-danger'
                )}
                placeholder={c('Label').t`Field name`}
                autoFocus={autoFocus}
                field={{
                    ...field,
                    value: field.value.fieldName,
                    onChange: onChangeHandler((evt, values) => partialMerge(values, { fieldName: evt.target.value })),
                }}
                {...rest}
            />

            {(() => {
                switch (field.value.type) {
                    case 'text':
                    case 'hidden': {
                        const FieldComponent =
                            field.value.type === 'hidden' ? BaseMaskedTextAreaField : BaseTextAreaField;
                        const fieldError = error as ExtraFieldError<'text' | 'hidden'>;
                        return (
                            <FieldComponent
                                placeholder={placeholder}
                                error={touched && (error?.fieldName || fieldError?.data?.content)}
                                field={{
                                    ...field,
                                    value: field.value.data.content,
                                    onChange: onChangeHandler((evt, values) =>
                                        partialMerge(values, { data: { content: evt.target.value } })
                                    ),
                                }}
                                {...rest}
                            />
                        );
                    }
                    case 'totp': {
                        const fieldError = error as ExtraFieldError<'totp'>;
                        return (
                            <BaseTextField
                                hidden
                                placeholder={placeholder}
                                error={touched && (error?.fieldName || fieldError?.data?.totpUri)}
                                field={{
                                    ...field,
                                    value: field.value.data.totpUri,
                                    onChange: onChangeHandler((evt, values) =>
                                        partialMerge(values, { data: { totpUri: evt.target.value } })
                                    ),
                                }}
                                {...rest}
                            />
                        );
                    }
                }
            })()}
        </FieldBox>
    );
};
