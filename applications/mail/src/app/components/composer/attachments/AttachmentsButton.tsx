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
        <div className="composer-attachments-button-wrapper">
            <input type="file" multiple onChange={handleChange} />
            <Button type="button" icon={!children && 'attach'} disabled={disabled}>
                {children}
            </Button>
        </div>
    );
};

export default AttachmentsButton;
