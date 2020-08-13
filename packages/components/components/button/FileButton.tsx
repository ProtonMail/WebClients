import React, { ChangeEvent, ReactNode } from 'react';
import { classnames } from '../../helpers';
import Icon from '../icon/Icon';

import './FileButton.scss';

interface Props {
    className?: string;
    icon?: string;
    disabled?: boolean;
    onAddFiles: (files: File[]) => void;
    children?: ReactNode;
}

const FileButton = ({ onAddFiles, icon = 'attach', disabled, className, children }: Props) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const input = event.target;
        if (input.files) {
            onAddFiles([...input.files]);
            input.value = '';
        }
    };

    return (
        <div className="file-button flex">
            <label
                role="button"
                className={classnames([
                    'pm-button inline-flex flex-items-center',
                    icon && !children && 'pm-button--for-icon',
                    disabled && 'is-disabled',
                    className,
                ])}
            >
                <Icon name="attach" />
                {children}
                <input type="file" multiple onChange={handleChange} data-testid="composer-attachments-button" />
            </label>
        </div>
    );
};

export default FileButton;
