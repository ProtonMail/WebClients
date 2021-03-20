import React, { ChangeEvent, useRef, useEffect } from 'react';
import { ButtonLike, classnames, Icon } from 'react-components';

interface Props {
    disabled?: boolean;
    onAddAttachments: (files: File[]) => void;
    attachmentTriggerRef: React.MutableRefObject<() => void>;
    isAttachments?: boolean;
}

const AttachmentsButton = ({ onAddAttachments, disabled, isAttachments, attachmentTriggerRef }: Props) => {
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
            <ButtonLike
                icon
                role="button"
                as="label"
                color={isAttachments ? 'norm' : 'weak'}
                shape="outline"
                className={classnames([disabled && 'is-disabled'])}
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
            </ButtonLike>
        </div>
    );
};

export default AttachmentsButton;
