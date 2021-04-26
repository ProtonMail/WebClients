import React, { ChangeEvent, useRef, useEffect } from 'react';
import { ButtonLike, ButtonLikeProps, classnames, Icon } from 'react-components';

interface Props extends ButtonLikeProps<'label'> {
    disabled?: boolean;
    onAddAttachments: (files: File[]) => void;
    attachmentTriggerRef: React.MutableRefObject<() => void>;
    isAttachments?: boolean;
}

const AttachmentsButton = React.forwardRef(
    ({ onAddAttachments, disabled, isAttachments, attachmentTriggerRef, ...rest }: Props, ref: typeof rest.ref) => {
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
                    className={classnames([disabled && 'is-disabled', isAttachments && 'is-selected'])}
                    ref={ref}
                    {...rest}
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
    }
);

export default AttachmentsButton;
