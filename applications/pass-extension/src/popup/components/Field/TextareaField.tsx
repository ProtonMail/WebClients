import type { VFC } from 'react';

import { type FieldProps } from 'formik';

import { InputFieldTwo, TextAreaTwo } from '@proton/components';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';
import clsx from '@proton/utils/clsx';

import { useFieldControl } from '../../hooks/useFieldControl';
import { useMaxLengthLimiter } from '../../hooks/useMaxLengthLimiter';
import { usePasteLengthLimiter } from '../../hooks/usePasteLengthLimiter';
import { FieldBox, type FieldBoxProps } from './Layout/FieldBox';

export type BaseTextAreaFieldProps = FieldProps & InputFieldProps<typeof TextAreaTwo>;

export const BaseTextAreaField: VFC<BaseTextAreaFieldProps> = ({ form, field, meta, ...props }) => {
    const { className, labelContainerClassName, onKeyDown, onPaste, ...rest } = props;
    const { error } = useFieldControl({ form, field, meta });
    const pasteLengthLimiter = usePasteLengthLimiter();
    const maxLengthLimiter = useMaxLengthLimiter();

    return (
        <TextAreaTwo
            autoGrow
            unstyled
            className={clsx('border-none flex p-0 resize-none', className)}
            error={error}
            {...field}
            {...rest}
            onPaste={props.maxLength ? pasteLengthLimiter(props.maxLength, onPaste) : onPaste}
            onKeyDown={props.maxLength ? maxLengthLimiter(props.maxLength, onKeyDown) : onKeyDown}
        />
    );
};

export type TextAreaFieldProps = FieldBoxProps & BaseTextAreaFieldProps;

export const TextAreaField: VFC<TextAreaFieldProps> = ({
    actions,
    actionsContainerClassName,
    labelContainerClassName,
    className,
    icon,
    form,
    field,
    meta,
    onKeyDown,
    onPaste,
    ...props
}) => {
    const { error } = useFieldControl({ form, field, meta });
    const pasteLengthLimiter = usePasteLengthLimiter();
    const maxLengthLimiter = useMaxLengthLimiter();

    return (
        <FieldBox
            actions={actions}
            actionsContainerClassName={actionsContainerClassName}
            className={className}
            icon={icon}
        >
            <InputFieldTwo
                as={TextAreaTwo}
                autoGrow
                unstyled
                minRows={1}
                rows={5}
                assistContainerClassName="hidden-empty"
                error={error}
                className="border-none flex p-0 resize-none"
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
        </FieldBox>
    );
};
