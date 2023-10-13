import type { ForwardRefRenderFunction } from 'react';
import { type VFC, forwardRef, useEffect, useMemo, useRef, useState } from 'react';

import { type FieldProps } from 'formik';

import { InputFieldTwo, TextAreaTwo } from '@proton/components';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import clsx from '@proton/utils/clsx';

import { useFieldControl } from '../../../hooks/useFieldControl';
import { useMaxLengthLimiter } from '../../../hooks/useMaxLengthLimiter';
import { usePasteLengthLimiter } from '../../../hooks/usePasteLengthLimiter';
import { FieldBox, type FieldBoxProps } from './Layout/FieldBox';

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
            assistContainerClassName="hidden-empty"
            className={clsx(
                'border-none flex p-0 resize-none',
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

export const BaseMaskedTextAreaField: VFC<BaseTextAreaFieldProps> = ({ form, field, ...rest }) => {
    const { value } = field;
    const [masked, setMasked] = useState<boolean>(true);
    const ref = useRef<HTMLTextAreaElement>(null);
    const isEmpty = isEmptyString(value);

    useEffect(() => {
        if (!masked) {
            setTimeout(() => ref?.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
    }, [masked]);

    const maskedValue = !masked || isEmpty ? value : '••••••••••••••••';

    return (
        <BaseTextAreaField
            className={clsx(!isEmpty && masked && 'text-monospace')}
            onFocus={() => setMasked(false)}
            onBlur={pipe(field.onBlur, () => setMasked(true))}
            form={form}
            field={field}
            ref={ref}
            rows={masked ? DEFAULT_MIN_ROWS : rest.rows}
            value={maskedValue}
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
}) => (
    <FieldBox actions={actions} actionsContainerClassName={actionsContainerClassName} className={className} icon={icon}>
        <BaseTextAreaField {...props} />
    </FieldBox>
);
