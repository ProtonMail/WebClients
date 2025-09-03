import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { Checkbox, Info, Label } from '@proton/components';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { ATTACHMENT_DISPOSITION } from '@proton/shared/lib/mail/constants';

import ComposerInnerModal from './ComposerInnerModal';

interface Props {
    files: File[];
    onSelect: (action: ATTACHMENT_DISPOSITION, removeImageMetadata?: boolean) => void;
    onClose: () => void;
    mailSettings?: MailSettings;
    canShowMetadataToggle?: boolean;
}

const ComposerInsertImageModal = ({ files, onSelect, onClose, mailSettings, canShowMetadataToggle }: Props) => {
    const [removeImageMetadata, setRemoveImageMetadata] = useState(!!mailSettings?.RemoveImageMetadata);
    const actions = (
        <>
            {canShowMetadataToggle && mailSettings ? (
                <Label htmlFor="remove-image-metadata-checkbox" className="w-full flex flex-nowrap mb-3 items-center">
                    <Checkbox
                        id="remove-image-metadata-checkbox"
                        className="mr-2"
                        checked={removeImageMetadata}
                        onChange={(event) => setRemoveImageMetadata(event.target.checked)}
                    />
                    <span className="flex-1 flex flex-nowrap items-center gap-2">
                        <span>{c('Label').t`Remove metadata`}</span>
                        <Info
                            buttonClass="content-center"
                            title={c('Tooltip')
                                .t`This ensures no one can see location, device, and other information that could be used to identify or track you.`}
                        />
                    </span>
                </Label>
            ) : null}
            <Button
                color="norm"
                fullWidth
                onClick={() => onSelect(ATTACHMENT_DISPOSITION.ATTACHMENT, removeImageMetadata)}
                data-testid="composer:insert-image-attachment"
                autoFocus
            >
                {c('Action').t`Attachment`}
            </Button>
            <Button
                color="norm"
                fullWidth
                onClick={() => onSelect(ATTACHMENT_DISPOSITION.INLINE, removeImageMetadata)}
                data-testid="composer:insert-image-inline"
            >{c('Action').t`Inline`}</Button>
        </>
    );

    return (
        <ComposerInnerModal
            title={c('Info').ngettext(msgid`Insert image`, `Insert images`, files.length)}
            onCancel={onClose}
            submitActions={actions}
        >
            <p className="text-left mb-0">{c('Info')
                .t`You can add it as an attachment or display it inline in your mail body.`}</p>
        </ComposerInnerModal>
    );
};
export default ComposerInsertImageModal;
