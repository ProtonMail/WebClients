import { c, msgid } from 'ttag';

import { Button } from '@proton/components';

import { ATTACHMENT_ACTION } from '../../../helpers/attachment/attachmentUploader';
import ComposerInnerModal from './ComposerInnerModal';

interface Props {
    files: File[];
    onSelect: (action: ATTACHMENT_ACTION) => void;
    onClose: () => void;
}

const ComposerInsertImageModal = ({ files, onSelect, onClose }: Props) => {
    const actions = (
        <>
            <Button
                color="norm"
                fullWidth
                onClick={() => onSelect(ATTACHMENT_ACTION.ATTACHMENT)}
                data-testid="composer:insert-image-attachment"
                autoFocus
            >
                {c('Action').t`Attachment`}
            </Button>
            <Button
                color="norm"
                fullWidth
                onClick={() => onSelect(ATTACHMENT_ACTION.INLINE)}
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
