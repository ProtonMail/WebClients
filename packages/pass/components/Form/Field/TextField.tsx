import type { ForwardRefRenderFunction } from 'react';
import { forwardRef, useState } from 'react';

import { type FieldProps } from 'formik';

import type { Input } from '@proton/atoms';
import { InputFieldTwo } from '@proton/components';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import clsx from '@proton/utils/clsx';
import identity from '@proton/utils/identity';

import { useFieldControl } from '../../../hooks/useFieldControl';
import { useMaxLengthLimiter } from '../../../hooks/useMaxLengthLimiter';
import { usePasteLengthLimiter } from '../../../hooks/usePasteLengthLimiter';
import { FieldBox, type FieldBoxProps } from './Layout/FieldBox';

export type BaseTextFieldProps = FieldProps &
    InputFieldProps<typeof Input> & {
        hidden?: boolean;
        hiddenValue?: string;
        lengthLimiters?: boolean;
    };

const BaseTextFieldRender: ForwardRefRenderFunction<HTMLInputElement, BaseTextFieldProps> = (
    {
        field,
        form,
        meta,
        hidden = false,
        hiddenValue,
        inputClassName,
        labelContainerClassName,
        lengthLimiters = false,
        onKeyDown,
        onFocus = identity,
        onPaste,
        ...props
    },
    ref
) => {
    const { onBlur, value } = field;
    const { error } = useFieldControl({ field, form, meta });
    const [focused, setFocused] = useState<boolean>(false);
    const hide = hidden && !isEmptyString(value) && !focused;
    const pasteLengthLimiter = usePasteLengthLimiter();
    const maxLengthLimiter = useMaxLengthLimiter();
    const defaultHiddenValue = '••••••••••••';

    return (
        <InputFieldTwo
            unstyled
            assistContainerClassName="empty:hidden"
            error={error}
            inputClassName={clsx('p-0 rounded-none', props.disabled ? 'color-disabled' : 'color-norm', inputClassName)}
            labelContainerClassName={clsx(
                'm-0 text-normal text-sm',
                error ? 'color-danger' : 'color-weak',
                labelContainerClassName
            )}
            {...props}
            {...field}
            onBlur={pipe(onBlur, () => setFocused(false))}
            onFocus={pipe(onFocus, () => setFocused(true))}
            onKeyDown={lengthLimiters && props.maxLength ? maxLengthLimiter(props.maxLength, onKeyDown) : onKeyDown}
            onPaste={lengthLimiters && props.maxLength ? pasteLengthLimiter(props.maxLength, onPaste) : onPaste}
            ref={ref}
            type="text"
            value={hide ? (hiddenValue ?? defaultHiddenValue) : value}
        />
    );
};

export const BaseTextField = forwardRef(BaseTextFieldRender);

export type TextFieldProps = FieldBoxProps & BaseTextFieldProps;

export const TextFieldRender: ForwardRefRenderFunction<HTMLInputElement, TextFieldProps> = (
    { actions, actionsContainerClassName, className, icon, ...rest },
    ref
) => {
    return (
        <FieldBox
            actions={actions}
            actionsContainerClassName={actionsContainerClassName}
            className={className}
            icon={icon}
        >
            <BaseTextField {...rest} ref={ref} />
        </FieldBox>
    );
};

export const TextField = forwardRef(TextFieldRender);
