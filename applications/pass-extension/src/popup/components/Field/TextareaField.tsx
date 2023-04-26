import { VFC } from 'react';

import { type FieldProps } from 'formik';

import { InputFieldTwo, TextAreaTwo } from '@proton/components';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';
import clsx from '@proton/utils/clsx';

import { useFieldControl } from '../../hooks/useFieldControl';
import { usePasteLengthLimiter } from '../../hooks/usePasteLengthLimiter';
import { FieldBox, type FieldBoxProps } from './Layout/FieldBox';

export type BaseTextAreaFieldProps = FieldProps & InputFieldProps<typeof TextAreaTwo>;

export const BaseTextAreaField: VFC<BaseTextAreaFieldProps> = ({ form, field, meta, ...props }) => {
    const { className, labelContainerClassName, ...rest } = props;
    const { error } = useFieldControl({ form, field, meta });
    const pasteLengthLimiter = usePasteLengthLimiter();

    return (
        <TextAreaTwo
            autoGrow
            unstyled
            className={clsx('border-none flex p-0 resize-none', className)}
            error={error}
            onPaste={props.maxLength ? pasteLengthLimiter(props.maxLength) : undefined}
            {...field}
            {...rest}
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
    ...props
}) => {
    const { error } = useFieldControl({ form, field, meta });
    const pasteLengthLimiter = usePasteLengthLimiter();

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
                    'text-normal text-sm',
                    error ? 'color-danger' : 'color-weak',
                    labelContainerClassName
                )}
                onPaste={props.maxLength ? pasteLengthLimiter(props.maxLength) : undefined}
                {...field}
                {...props}
            />
        </FieldBox>
    );
};
