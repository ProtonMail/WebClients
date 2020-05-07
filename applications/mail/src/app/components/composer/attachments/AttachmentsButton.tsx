import React, { ChangeEvent, ReactNode } from 'react';
import { classnames, Icon } from 'react-components';

interface Props {
    className?: string;
    disabled?: boolean;
    onAddAttachments: (files: File[]) => void;
    children?: ReactNode;
}

const AttachmentsButton = ({ onAddAttachments, disabled, className }: Props) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const input = event.target;
        if (input.files) {
            onAddAttachments([...input.files]);
            input.value = '';
        }
    };

    return (
        <div className="composer-attachments-button-wrapper flex">
            <label
                role="button"
                className={classnames([
                    'pm-button pm-button--for-icon inline-flex flex-items-center',
                    disabled && 'is-disabled',
                    className
                ])}
            >
                <Icon name="attach" />
                <input type="file" multiple onChange={handleChange} data-testid="composer-attachments-button" />
            </label>
        </div>
    );
};

export default AttachmentsButton;
