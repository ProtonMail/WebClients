import type { ForwardRefRenderFunction } from 'react';
import { type FC, forwardRef, useMemo, useState } from 'react';

import { type FieldProps } from 'formik';

import { InputFieldTwo, TextAreaTwo } from '@proton/components';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';
import { useFieldControl } from '@proton/pass/hooks/useFieldControl';
import { useMaxLengthLimiter } from '@proton/pass/hooks/useMaxLengthLimiter';
import { usePasteLengthLimiter } from '@proton/pass/hooks/usePasteLengthLimiter';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import clsx from '@proton/utils/clsx';

import { FieldBox, type FieldBoxProps } from './Layout/FieldBox';

import './TextareaField.scss';

export type BaseTextAreaFieldProps = FieldProps & InputFieldProps<typeof TextAreaTwo>;

const DEFAULT_MIN_ROWS = 1;
const DEFAULT_MAX_ROWS = 5;

const BaseTextAreaFieldRender: ForwardRefRenderFunction<HTMLTextAreaElement, BaseTextAreaFieldProps> = (
    { className, form, field, labelContainerClassName, meta, onKeyDown, onPaste, ...props },
    ref
) => {
    const { error } = useFieldControl({ form, field, meta });
    const pasteLengthLimiter = usePasteLengthLimiter();
    const maxLengthLimiter = useMaxLengthLimiter();

    const { value } = field;
    const { minRows, rows } = props;

    /* the nested `useAutoGrow` doesn't support initial row resolution
     * on initial mount - we resort to a dynamic `minRows` prop */
    const dynamicMinRows = useMemo(
        () => Math.max(minRows ?? DEFAULT_MIN_ROWS, Math.min(value.split('\n').length, rows ?? DEFAULT_MAX_ROWS)),
        [minRows, rows, value]
    );

    return (
        <InputFieldTwo
            as={TextAreaTwo}
            ref={ref}
            autoGrow
            unstyled
            assistContainerClassName="empty:hidden"
            className={clsx(
                'pass--textarea-field border-none flex p-0 resize-none',
                props.disabled ? 'color-disabled' : 'color-norm',
                className
            )}
            error={error}
            labelContainerClassName={clsx(
                'm-0 text-normal text-sm',
                error ? 'color-danger' : 'color-weak',
                labelContainerClassName
            )}
            rows={DEFAULT_MAX_ROWS}
            {...field}
            {...props}
            minRows={dynamicMinRows}
            onPaste={props.maxLength ? pasteLengthLimiter(props.maxLength, onPaste) : onPaste}
            onKeyDown={props.maxLength ? maxLengthLimiter(props.maxLength, onKeyDown) : onKeyDown}
        />
    );
};

export const BaseTextAreaField = forwardRef(BaseTextAreaFieldRender);

export const BaseMaskedTextAreaField: FC<BaseTextAreaFieldProps> = ({ form, field, ...rest }) => {
    const { value } = field;
    const [masked, setMasked] = useState<boolean>(true);
    const isEmpty = isEmptyString(value);

    return (
        <BaseTextAreaField
            className={clsx(!isEmpty && masked && 'text-monospace')}
            onFocus={() => setMasked(false)}
            onBlur={pipe(field.onBlur, () => setMasked(true))}
            form={form}
            field={field}
            rows={masked ? DEFAULT_MIN_ROWS : rest.rows}
            value={!masked || isEmpty ? value : '•'.repeat(16)}
            {...rest}
        />
    );
};

export type TextAreaFieldProps = FieldBoxProps & BaseTextAreaFieldProps;

export const TextAreaField: FC<TextAreaFieldProps> = ({
    actions,
    actionsContainerClassName,
    className,
    icon,
    hidden,
    ...props
}) => {
    const TextAreaComponent = hidden ? BaseMaskedTextAreaField : BaseTextAreaField;

    return (
        <FieldBox
            actions={actions}
            actionsContainerClassName={actionsContainerClassName}
            className={className}
            icon={icon}
        >
            <TextAreaComponent {...props} />
        </FieldBox>
    );
};
