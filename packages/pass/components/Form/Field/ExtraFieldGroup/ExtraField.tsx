import type { ChangeEvent, FC } from 'react';

import type { FieldInputProps, FormikErrors } from 'formik';
import { c } from 'ttag';

import { Button, type ButtonProps } from '@proton/atoms';
import { Icon } from '@proton/components';
import { DateField } from '@proton/pass/components/Form/Field/DateField';
import type { FieldBoxProps } from '@proton/pass/components/Form/Field/Layout/FieldBox';
import { FieldBox } from '@proton/pass/components/Form/Field/Layout/FieldBox';
import type { BaseTextFieldProps } from '@proton/pass/components/Form/Field/TextField';
import { BaseTextField } from '@proton/pass/components/Form/Field/TextField';
import type { BaseTextAreaFieldProps } from '@proton/pass/components/Form/Field/TextareaField';
import { BaseMaskedTextAreaField, BaseTextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import type { DeobfuscatedItemExtraField, ExtraFieldType } from '@proton/pass/types';
import { partialMerge } from '@proton/pass/utils/object/merge';
import clsx from '@proton/utils/clsx';

import { getExtraFieldOption } from './ExtraField.utils';

type ExtraFieldError<T extends ExtraFieldType> = FormikErrors<DeobfuscatedItemExtraField<T>>;

export type ExtraFieldProps = FieldBoxProps &
    Omit<BaseTextFieldProps & BaseTextAreaFieldProps, 'field' | 'placeholder' | 'error'> & {
        type: ExtraFieldType;
        field: FieldInputProps<DeobfuscatedItemExtraField>;
        error?: ExtraFieldError<ExtraFieldType>;
        touched?: boolean;
        autoFocus?: boolean;
        hideIcon?: boolean;
        onDelete: () => void;
    };

type DeleteButtonProps = ButtonProps & { onDelete: () => void };
export const DeleteButton: FC<DeleteButtonProps> = ({ onDelete }) => (
    <Button
        icon
        pill
        color="weak"
        className="button-xs"
        onClick={onDelete}
        shape="solid"
        size="small"
        title={c('Action').t`Delete`}
    >
        <Icon name="cross" />
    </Button>
);

export const ExtraFieldComponent: FC<ExtraFieldProps> = ({
    autoFocus,
    className,
    error,
    field,
    hideIcon = false,
    touched,
    type,
    onDelete,
    ...rest
}) => {
    const options = getExtraFieldOption(type);
    const { placeholder } = options;
    const icon = hideIcon ? undefined : options.icon;

    const onChangeHandler =
        (
            merge: (evt: ChangeEvent<HTMLInputElement>, field: DeobfuscatedItemExtraField) => DeobfuscatedItemExtraField
        ) =>
        (evt: ChangeEvent<HTMLInputElement>) => {
            void rest.form.setFieldValue(field.name, merge(evt, field.value));
        };

    const hasError = touched && error?.fieldName;

    return (
        <FieldBox actions={[<DeleteButton onDelete={onDelete} />]} className={className} icon={icon}>
            <BaseTextField
                inputClassName={clsx('text-sm', hasError ? 'placeholder-danger' : 'color-weak')}
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
                                placeholder={field.value.fieldName || placeholder}
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
                    case 'timestamp': {
                        const fieldError = error as ExtraFieldError<'timestamp'>;
                        return (
                            <DateField
                                placeholder={placeholder}
                                error={touched && (error?.fieldName || fieldError?.data?.timestamp)}
                                field={{
                                    ...field,
                                    value: field.value.data.timestamp,
                                    onChange: (timestamp: string | ChangeEvent) => {
                                        if (typeof timestamp === 'string') {
                                            void rest.form.setFieldValue(
                                                field.name,
                                                partialMerge(field.value, { data: { timestamp } })
                                            );
                                        }
                                    },
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
