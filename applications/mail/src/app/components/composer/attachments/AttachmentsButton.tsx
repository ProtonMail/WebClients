import React, { ChangeEvent } from 'react';
import { Button } from 'react-components';

interface Props {
    onAddAttachments: (files: File[]) => void;
}

const AttachmentsButton = ({ onAddAttachments }: Props) => {
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
            <Button icon="attach" />
        </div>
    );
};

export default AttachmentsButton;
