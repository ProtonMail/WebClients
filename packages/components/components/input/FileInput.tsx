import React, { ChangeEvent, forwardRef, useRef, useImperativeHandle } from 'react';
import { classnames } from '../../helpers';

export interface FileInputHandle {
    click: () => void;
}

export interface Props extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    children: React.ReactNode;
    id?: string;
    className?: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}
const FileInput = forwardRef<FileInputHandle, Props>(
    ({ children, id = 'fileInput', className, onChange, ...rest }: Props, ref) => {
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
            <label className={classnames(['button', className])} htmlFor={id}>
                <input id={id} type="file" className="hidden" onChange={handleChange} {...rest} ref={inputRef} />
                {children}
            </label>
        );
    }
);

export default FileInput;
