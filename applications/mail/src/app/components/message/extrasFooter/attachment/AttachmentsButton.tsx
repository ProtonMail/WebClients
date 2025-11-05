import type { ChangeEvent, Ref } from 'react';
import { forwardRef, useEffect, useRef } from 'react';
import * as React from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { ButtonLikeProps } from '@proton/atoms/Button/ButtonLike';
import { IcPaperClip } from '@proton/icons';
import clsx from '@proton/utils/clsx';

interface Props extends ButtonLikeProps<'label'> {
    disabled?: boolean;
    onAddAttachments: (files: File[]) => void;
    attachmentTriggerRef?: React.MutableRefObject<() => void>;
    isAttachments?: boolean;
}

const AttachmentsButton = (
    { onAddAttachments, disabled, isAttachments, attachmentTriggerRef, ...rest }: Props,
    ref: Ref<HTMLLabelElement>
) => {
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
        if (attachmentTriggerRef) {
            attachmentTriggerRef.current = triggerAttachment;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-71B888
    }, []);

    return (
        <div className="composer-attachments-button-wrapper flex *:items-center">
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
            <ButtonLike
                icon
                role="button"
                as="label"
                color={isAttachments ? 'norm' : 'weak'}
                shape="ghost"
                className={clsx(['inline-flex', disabled && 'is-disabled'])}
                ref={ref}
                {...rest}
                data-testid="composer:attachment-button"
            >
                <IcPaperClip alt={c('Title').t`Attachments`} />
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    disabled={disabled}
                    onChange={handleChange}
                    className="composer-attachments-button"
                    data-testid="composer-attachments-button"
                />
            </ButtonLike>
        </div>
    );
};

export default forwardRef(AttachmentsButton);
