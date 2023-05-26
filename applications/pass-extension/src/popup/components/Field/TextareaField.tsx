import { type VFC, useState } from 'react';

import { type FieldProps } from 'formik';

import { InputFieldTwo, TextAreaTwo } from '@proton/components';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';
import { pipe } from '@proton/pass/utils/fp';
import { replaceAllRetainFormat } from '@proton/pass/utils/string';
import clsx from '@proton/utils/clsx';

import { useFieldControl } from '../../hooks/useFieldControl';
import { useMaxLengthLimiter } from '../../hooks/useMaxLengthLimiter';
import { usePasteLengthLimiter } from '../../hooks/usePasteLengthLimiter';
import { FieldBox, type FieldBoxProps } from './Layout/FieldBox';

export type BaseTextAreaFieldProps = FieldProps & InputFieldProps<typeof TextAreaTwo>;

export const BaseTextAreaField: VFC<BaseTextAreaFieldProps> = ({
    className,
    form,
    field,
    labelContainerClassName,
    meta,
    onKeyDown,
    onPaste,
    ...props
}) => {
    const { error } = useFieldControl({ form, field, meta });
    const pasteLengthLimiter = usePasteLengthLimiter();
    const maxLengthLimiter = useMaxLengthLimiter();

    return (
        <InputFieldTwo
            as={TextAreaTwo}
            autoGrow
            unstyled
            assistContainerClassName="hidden-empty"
            className={clsx('border-none flex p-0 resize-none', className)}
            error={error}
            labelContainerClassName={clsx(
                'm-0 text-normal text-sm',
                error ? 'color-danger' : 'color-weak',
                labelContainerClassName
            )}
            minRows={1}
            rows={5}
            {...field}
            {...props}
            onPaste={props.maxLength ? pasteLengthLimiter(props.maxLength, onPaste) : onPaste}
            onKeyDown={props.maxLength ? maxLengthLimiter(props.maxLength, onKeyDown) : onKeyDown}
        />
    );
};

export const BaseMaskedTextAreaField: VFC<BaseTextAreaFieldProps> = ({ form, field, ...rest }) => {
    const [masked, setMasked] = useState<boolean>(true);
    const maskedValue = replaceAllRetainFormat(field.value, '•');

    return (
        <BaseTextAreaField
            className={clsx(masked && 'text-monospace')}
            onFocus={() => setMasked(false)}
            onBlur={pipe(field.onBlur, () => setMasked(true))}
            form={form}
            field={field}
            value={masked ? maskedValue : field.value}
            {...rest}
        />
    );
};

export type TextAreaFieldProps = FieldBoxProps & BaseTextAreaFieldProps;

export const TextAreaField: VFC<TextAreaFieldProps> = ({
    actions,
    actionsContainerClassName,
    className,
    icon,
    ...props
}) => {
    return (
        <FieldBox
            actions={actions}
            actionsContainerClassName={actionsContainerClassName}
            className={className}
            icon={icon}
        >
            <BaseTextAreaField {...props} />
        </FieldBox>
    );
};
