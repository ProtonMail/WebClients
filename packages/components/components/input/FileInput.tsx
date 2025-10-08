import type { ChangeEvent, DetailedHTMLProps, InputHTMLAttributes, ReactNode, Ref } from 'react';
import { forwardRef, useRef } from 'react';

import type { ButtonLikeShape } from '@proton/atoms/Button/ButtonLike';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { ThemeColorUnion } from '@proton/colors';
import { useCombinedRefs } from '@proton/hooks';
import clsx from '@proton/utils/clsx';

export interface Props extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    children: ReactNode;
    id?: string;
    className?: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    shape?: ButtonLikeShape;
    color?: ThemeColorUnion;
    loading?: boolean;
}

const FileInput = (
    { children, id = 'fileInput', className, onChange, disabled, shape, color, loading, ...rest }: Props,
    ref: Ref<HTMLInputElement>
) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const combinedRef = useCombinedRefs(inputRef, ref);

    return (
        <ButtonLike
            as="label"
            htmlFor={id}
            className={clsx(className, 'relative')}
            disabled={disabled}
            shape={shape}
            color={color}
            loading={loading}
        >
            <input
                id={id}
                type="file"
                className="sr-only"
                onChange={(e) => {
                    onChange(e);
                    if (inputRef.current) {
                        // Reset it to allow to select the same file again.
                        inputRef.current.value = '';
                    }
                }}
                {...rest}
                ref={combinedRef}
            />
            {children}
        </ButtonLike>
    );
};

export default forwardRef<HTMLInputElement, Props>(FileInput);
