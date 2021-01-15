import React, { ChangeEvent, useRef, useEffect } from 'react';
import { classnames, Icon } from 'react-components';

interface Props {
    className?: string;
    disabled?: boolean;
    onAddAttachments: (files: File[]) => void;
    attachmentTriggerRef: React.MutableRefObject<() => void>;
}

const AttachmentsButton = ({ onAddAttachments, disabled, className, attachmentTriggerRef }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const input = event.target;
        if (input.files) {
            onAddAttachments([...input.files]);
            input.value = '';
        }
    };

    const triggerAttachment = () => inputRef?.current?.click();

    useEffect(() => {
        attachmentTriggerRef.current = triggerAttachment;
    }, []);

    return (
        <div className="composer-attachments-button-wrapper flex">
            <label // eslint-disable-line
                role="button" // eslint-disable-line
                className={classnames([
                    'pm-button pm-button--for-icon inline-flex flex-items-center',
                    disabled && 'is-disabled',
                    className,
                ])}
            >
                <Icon name="attach" />
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    onChange={handleChange}
                    className="composer-attachments-button"
                    data-testid="composer-attachments-button"
                />
            </label>
        </div>
    );
};

export default AttachmentsButton;
