import { CSSProperties, ElementType, ForwardedRef, forwardRef } from 'react';

import { InputField as CoreInput, InputFieldProps } from '@proton/components/components/v2/field/InputField';
import clsx from '@proton/utils/clsx';

import './Input.scss';

export { CoreInput };

export type InputProps<E extends ElementType = typeof CoreInput> = Omit<
    InputFieldProps<E>,
    'children' | 'assistContainerClassName' | 'labelContainerClassName' | 'unstyled'
> & {
    containerClassName?: string;
    containerStyle?: CSSProperties;
    label: string;
    bordered?: boolean;
};

export const Input = forwardRef(
    ({ containerClassName, containerStyle, bordered, ...props }: InputProps, ref: ForwardedRef<HTMLInputElement>) => {
        return (
            <div
                className={clsx(
                    'wallet-input bg-weak py-5 px-6 rounded-xl color-norm w-full',
                    containerClassName,
                    bordered && 'bordered',
                    props.disabled && 'disabled'
                )}
                style={containerStyle}
            >
                <CoreInput
                    ref={ref}
                    autoComplete="off"
                    assistContainerClassName="empty:hidden"
                    labelContainerClassName="expand-click-area color-hint m-0 text-normal text-sm color-weak"
                    inputClassName="p-0 rounded-none"
                    unstyled
                    {...props}
                />
            </div>
        );
    }
);

Input.displayName = 'Input';
