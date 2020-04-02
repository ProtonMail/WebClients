import React, { ChangeEvent, ReactNode } from 'react';
import { Button, classnames } from 'react-components';

interface Props {
    className?: string;
    disabled?: boolean;
    onAddAttachments: (files: File[]) => void;
    children?: ReactNode;
}

const AttachmentsButton = ({ onAddAttachments, children, disabled, className }: Props) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const input = event.target;
        if (input.files) {
            onAddAttachments([...input.files]);
            input.value = '';
        }
    };

    return (
        <div className="composer-attachments-button-wrapper flex">
            <input type="file" multiple onChange={handleChange} data-testid="composer-attachments-button" />
            <Button
                type="button"
                className={classnames(['inline-flex flex-items-center', className])}
                icon={!children && 'attach'}
                disabled={disabled}
            >
                {children}
            </Button>
        </div>
    );
};

export default AttachmentsButton;
