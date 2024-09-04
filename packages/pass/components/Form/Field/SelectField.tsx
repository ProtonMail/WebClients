import { type FC, type MutableRefObject, useRef } from 'react';

import { type FieldProps } from 'formik';

import { InputFieldTwo, SelectTwo } from '@proton/components';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';
import clsx from '@proton/utils/clsx';

import { useFieldControl } from '../../../hooks/useFieldControl';
import { FieldBox, type FieldBoxProps } from './Layout/FieldBox';

export type SelectFieldProps = FieldProps &
    InputFieldProps<typeof SelectTwo> &
    Omit<FieldBoxProps, 'actions' | 'actionsContainerClassName'> & { selectClassName?: string };

const Loader: FC = () => <div className="pass-skeleton pass-skeleton--select" />;

export const SelectField: FC<SelectFieldProps> = ({
    children,
    className,
    field,
    form,
    icon,
    loading,
    meta,
    selectClassName,
    onValue,
    renderSelected,
    ...props
}) => {
    const { error } = useFieldControl({ field, form, meta });
    const fieldBoxRef = useRef<HTMLDivElement>(null);

    return (
        <FieldBox className={clsx('items-center', className)} icon={icon} ref={fieldBoxRef} unstyled={props.unstyled}>
            <InputFieldTwo<typeof SelectTwo>
                as={SelectTwo}
                assistContainerClassName="empty:hidden"
                error={error}
                labelContainerClassName="expand-click-area color-weak m-0 text-normal text-sm"
                originalPlacement="bottom"
                renderSelected={() => (loading ? <Loader /> : renderSelected?.())}
                anchorRef={fieldBoxRef as MutableRefObject<any>}
                unstyled
                {...field}
                {...props}
                className={selectClassName}
                onChange={undefined}
                onValue={(value: unknown) => {
                    onValue?.(value);
                    return form.setFieldValue(field.name, value);
                }}
            >
                {children}
            </InputFieldTwo>
        </FieldBox>
    );
};
