import { ElementType } from 'react';
import { CSSProperties } from 'react';

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
};

export const Input = ({ containerClassName, containerStyle, ...props }: InputProps) => {
    return (
        <div
            className={clsx('wallet-input bg-weak py-5 px-6 rounded-xl color-norm w-full', containerClassName)}
            style={containerStyle}
        >
            <CoreInput
                assistContainerClassName="empty:hidden"
                labelContainerClassName="expand-click-area color-hint m-0 text-normal text-sm"
                inputClassName="p-0 mt-1 rounded-none"
                unstyled
                {...props}
            />
        </div>
    );
};
