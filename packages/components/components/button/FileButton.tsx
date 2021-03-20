import React, { ChangeEvent, KeyboardEvent, useRef, ReactNode } from 'react';
import { classnames } from '../../helpers';
import { useCombinedRefs } from '../../hooks';

import ButtonLike from './ButtonLike';
import './FileButton.scss';

interface Props extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    className?: string;
    disabled?: boolean;
    onAddFiles: (files: File[]) => void;
    children?: ReactNode;
}

const FileButton = (
    { onAddFiles, disabled, className, children, ...rest }: Props,
    ref: React.Ref<HTMLInputElement>
) => {
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
                className={classnames([disabled && 'is-disabled', className])}
                onKeyDown={handleKey}
            >
                {children}
                <input ref={combinedRef} type="file" multiple onChange={handleChange} {...rest} />
            </ButtonLike>
        </div>
    );
};

export default React.forwardRef<HTMLInputElement, Props>(FileButton);
