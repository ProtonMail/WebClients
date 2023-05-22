import type { VFC } from 'react';

import { type FieldProps } from 'formik';

import type { Input } from '@proton/atoms/Input';
import { InputFieldTwo } from '@proton/components';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';
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

export type TextFieldProps = FieldBoxProps & BaseTextFieldProps;

export const TextField: VFC<TextFieldProps> = (props) => {
    const { actions, actionsContainerClassName, className, icon, ...rest } = props;

    return (
        <FieldBox
            actions={actions}
            actionsContainerClassName={actionsContainerClassName}
            className={className}
            icon={icon}
        >
            <BaseTextField {...rest} />
        </FieldBox>
    );
};
