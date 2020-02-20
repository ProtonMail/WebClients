import React from 'react';
import { c, msgid } from 'ttag';
import { HeaderModal, FooterModal, Button } from 'react-components';
import { ATTACHMENT_ACTION } from '../../../helpers/attachment/attachmentUploader';

interface Props {
    files: File[];
    onClose: () => void;
    onSelect: (action: ATTACHMENT_ACTION) => void;
}

const EditorEmbeddedModal = ({ files, onClose, onSelect }: Props) => {
    return (
        <div className="composer-editor-embedded absolute w100 h100 flex flex-justify-center flex-items-center">
            <div className="pm-modal pm-modal--smaller">
                <HeaderModal modalTitleID="" onClose={onClose}>
                    {c('Info').ngettext(
                        msgid`${files.length} image detected`,
                        `${files.length} images detected`,
                        files.length
                    )}
                </HeaderModal>
                <FooterModal>
                    {c('Info').t`Insert images`}
                    <Button onClick={() => onSelect(ATTACHMENT_ACTION.ATTACHMENT)}>
                        {c('Action').t`as attachment`}
                    </Button>
                    {c('Info').t`or`}
                    <Button onClick={() => onSelect(ATTACHMENT_ACTION.INLINE)}>{c('Action').t`inline`}</Button>
                </FooterModal>
            </div>
        </div>
    );
};

export default EditorEmbeddedModal;
