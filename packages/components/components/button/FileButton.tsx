import type { ChangeEvent, DetailedHTMLProps, InputHTMLAttributes, KeyboardEvent, ReactNode, Ref } from 'react';
import { forwardRef, useRef } from 'react';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { useCombinedRefs } from '@proton/hooks';
import clsx from '@proton/utils/clsx';

import './FileButton.scss';

interface Props extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    className?: string;
    disabled?: boolean;
    onAddFiles: (files: File[]) => void;
    children?: ReactNode;
}

const FileButton = ({ onAddFiles, disabled, className, children, ...rest }: Props, ref: Ref<HTMLInputElement>) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const combinedRef = useCombinedRefs(inputRef, ref);
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const input = event.target;
        if (input.files) {
            onAddFiles([...input.files]);
            input.value = '';
        }
    };
    const handleKey = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            inputRef.current?.click();
        }
    };

    return (
        <div className="file-button flex">
            <ButtonLike
                icon
                as="label"
                role="button"
                tabIndex={0}
                className={clsx([disabled && 'is-disabled', className])}
                onKeyDown={handleKey}
            >
                {children}
                <input ref={combinedRef} type="file" multiple onChange={handleChange} {...rest} />
            </ButtonLike>
        </div>
    );
};

export default forwardRef<HTMLInputElement, Props>(FileButton);
