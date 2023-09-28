import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { ATTACHMENT_DISPOSITION } from '@proton/shared/lib/mail/constants';

import ComposerInnerModal from './ComposerInnerModal';

interface Props {
    files: File[];
    onSelect: (action: ATTACHMENT_DISPOSITION) => void;
    onClose: () => void;
}

const ComposerInsertImageModal = ({ files, onSelect, onClose }: Props) => {
    const actions = (
        <>
            <Button
                color="norm"
                fullWidth
                onClick={() => onSelect(ATTACHMENT_DISPOSITION.ATTACHMENT)}
                data-testid="composer:insert-image-attachment"
                autoFocus
            >
                {c('Action').t`Attachment`}
            </Button>
            <Button
                color="norm"
                fullWidth
                onClick={() => onSelect(ATTACHMENT_DISPOSITION.INLINE)}
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
            <p className="text-left">{c('Info')
                .t`You can add it as an attachment or display it inline in your mail body.`}</p>
        </ComposerInnerModal>
    );
};
export default ComposerInsertImageModal;
