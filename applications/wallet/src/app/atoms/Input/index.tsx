import type { ElementType, ForwardedRef } from 'react';
import { forwardRef } from 'react';

import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import type { InputFieldProps } from '@proton/components/components/v2/field/InputField';
import { InputField as CoreInput } from '@proton/components/components/v2/field/InputField';

import '../InputFieldStacked/InputFieldStacked.scss';

export { CoreInput };

export type InputProps<E extends ElementType = typeof CoreInput> = Omit<
    InputFieldProps<E>,
    'children' | 'assistContainerClassName' | 'labelContainerClassName' | 'unstyled'
> & {
    containerClassName?: string;
    label: string;
    isGroupElement?: boolean;
};

export const Input = forwardRef(
    (
        { containerClassName, prefix, suffix, isGroupElement, ...props }: InputProps,
        ref: ForwardedRef<HTMLInputElement>
    ) => {
        return (
            <InputFieldStacked
                icon={prefix}
                suffix={suffix}
                isGroupElement={isGroupElement}
                isBigger
                classname={containerClassName}
                ref={ref}
            >
                <CoreInput
                    autoComplete="off"
                    assistContainerClassName="empty:hidden"
                    inputClassName="p-0 rounded-none"
                    unstyled
                    {...props}
                />
            </InputFieldStacked>
        );
    }
);

Input.displayName = 'Input';
