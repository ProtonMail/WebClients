import React, { ChangeEvent, ReactNode } from 'react';
import { Button } from 'react-components';

interface Props {
    onAddAttachments: (files: File[]) => void;
    children?: ReactNode;
    disabled?: boolean;
}

const AttachmentsButton = ({ onAddAttachments, children, disabled }: Props) => {
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
                className="inline-flex flex-items-center"
                icon={!children && 'attach'}
                disabled={disabled}
            >
                {children}
            </Button>
        </div>
    );
};

export default AttachmentsButton;
