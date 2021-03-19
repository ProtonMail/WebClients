import React, { ChangeEvent, forwardRef, useRef, useImperativeHandle } from 'react';
import { ButtonLike } from '../button';

export interface FileInputHandle {
    click: () => void;
}

export interface Props extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    children: React.ReactNode;
    id?: string;
    className?: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const FileInput = ({ children, id = 'fileInput', className, onChange, ...rest }: Props, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(e);
        if (inputRef.current) {
            // Reset it to allow to select the same file again.
            inputRef.current.value = '';
        }
    };

    useImperativeHandle(ref, () => ({
        click: () => {
            inputRef.current?.click();
        },
    }));

    return (
        <ButtonLike as="label" htmlFor={id}>
            <input id={id} type="file" className="hidden" onChange={handleChange} {...rest} ref={inputRef} />
            {children}
        </ButtonLike>
    );
};

export default forwardRef<FileInputHandle, Props>(FileInput);
