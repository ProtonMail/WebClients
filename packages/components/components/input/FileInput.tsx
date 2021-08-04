import { ChangeEvent, forwardRef, useRef } from 'react';
import * as React from 'react';
import { ButtonLike } from '../button';
import { useCombinedRefs } from '../../hooks';

export interface Props extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    children: React.ReactNode;
    id?: string;
    className?: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const FileInput = (
    { children, id = 'fileInput', className, onChange, ...rest }: Props,
    ref: React.Ref<HTMLInputElement>
) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const combinedRef = useCombinedRefs(inputRef, ref);

    return (
        <ButtonLike as="label" htmlFor={id} className={className}>
            <input
                id={id}
                type="file"
                className="hidden"
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
