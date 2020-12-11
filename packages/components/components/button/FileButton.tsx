import React, { ChangeEvent, KeyboardEvent, useRef, ReactNode } from 'react';
import { classnames } from '../../helpers';
import Icon from '../icon/Icon';

import './FileButton.scss';

interface Props extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    className?: string;
    icon?: string;
    disabled?: boolean;
    onAddFiles: (files: File[]) => void;
    children?: ReactNode;
}

const FileButton = ({ onAddFiles, icon = 'attach', disabled, className, children, ...rest }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);
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
            <label
                role="button"
                tabIndex={0}
                className={classnames([
                    'pm-button inline-flex relative flex-items-center',
                    icon && !children && 'pm-button--for-icon',
                    disabled && 'is-disabled',
                    className,
                ])}
                onKeyDown={handleKey}
            >
                <Icon name="attach" />
                {children}
                <input ref={inputRef} type="file" multiple onChange={handleChange} {...rest} />
            </label>
        </div>
    );
};

export default FileButton;
