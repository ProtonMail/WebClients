import { type VFC, useState } from 'react';

import { type FieldProps } from 'formik';

import type { Input } from '@proton/atoms/Input';
import { InputFieldTwo } from '@proton/components';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';
import { pipe } from '@proton/pass/utils/fp';
import { isEmptyString } from '@proton/pass/utils/string';
import clsx from '@proton/utils/clsx';

import { useFieldControl } from '../../hooks/useFieldControl';
import { useMaxLengthLimiter } from '../../hooks/useMaxLengthLimiter';
import { usePasteLengthLimiter } from '../../hooks/usePasteLengthLimiter';
import { FieldBox, type FieldBoxProps } from './Layout/FieldBox';

export type BaseTextFieldProps = FieldProps & InputFieldProps<typeof Input>;

export const BaseTextField: VFC<BaseTextFieldProps> = ({
    field,
    form,
    meta,
    inputClassName,
    labelContainerClassName,
    onKeyDown,
    onPaste,
    ...props
}) => {
    const { error } = useFieldControl({ field, form, meta });
    const pasteLengthLimiter = usePasteLengthLimiter();
    const maxLengthLimiter = useMaxLengthLimiter();

    return (
        <InputFieldTwo
            unstyled
            assistContainerClassName="hidden-empty"
            error={error}
            inputClassName={clsx('color-norm p-0 rounded-none', inputClassName)}
            labelContainerClassName={clsx(
                'm-0 text-normal text-sm',
                error ? 'color-danger' : 'color-weak',
                labelContainerClassName
            )}
            {...field}
            {...props}
            onPaste={props.maxLength ? pasteLengthLimiter(props.maxLength, onPaste) : onPaste}
            onKeyDown={props.maxLength ? maxLengthLimiter(props.maxLength, onKeyDown) : onKeyDown}
        />
    );
};

export const BaseMaskedTextField: VFC<BaseTextFieldProps> = ({ form, field, ...rest }) => {
    const { value } = field;
    const [masked, setMasked] = useState<boolean>(true);
    const isEmpty = isEmptyString(value);

    const maskedValue = !masked || isEmpty ? value : '••••••••••••••••';

    return (
        <BaseTextField
            inputClassName={clsx(!isEmpty && masked && 'text-monospace')}
            onFocus={() => setMasked(false)}
            onBlur={pipe(field.onBlur, () => setMasked(true))}
            form={form}
            field={field}
            value={maskedValue}
            {...rest}
        />
    );
};

export type TextFieldProps = FieldBoxProps &
    BaseTextFieldProps & {
        masked?: boolean;
    };

export const TextField: VFC<TextFieldProps> = (props) => {
    const { actions, actionsContainerClassName, className, icon, masked = false, ...rest } = props;
    const TextFieldComponent = masked ? BaseMaskedTextField : BaseTextField;

    return (
        <FieldBox
            actions={actions}
            actionsContainerClassName={actionsContainerClassName}
            className={className}
            icon={icon}
        >
            <TextFieldComponent {...rest} />
        </FieldBox>
    );
};
