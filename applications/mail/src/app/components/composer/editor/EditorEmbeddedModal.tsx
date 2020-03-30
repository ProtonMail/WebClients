import React from 'react';
import { c, msgid } from 'ttag';
import { HeaderModal, Button } from 'react-components';
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
                <HeaderModal
                    modalTitleID=""
                    closeTextModal={c('Action').t`Cancel`}
                    closeTextVisible={true}
                    onClose={onClose}
                >
                    {c('Info').ngettext(
                        msgid`${files.length} image detected`,
                        `${files.length} images detected`,
                        files.length
                    )}
                </HeaderModal>
                <footer className="p2 pt0 flex flex-column">
                    <span className="mb0-5 w100">{c('Info').t`Insert images as:`}</span>
                    <span className="mb0-5 w100">
                        <Button className="pm-button--primary" onClick={() => onSelect(ATTACHMENT_ACTION.ATTACHMENT)}>
                            {c('Action').t`Attachment`}
                        </Button>
                        <span className="ml1 mr1">{c('Info').t`or`}</span>
                        <Button className="pm-button--primary" onClick={() => onSelect(ATTACHMENT_ACTION.INLINE)}>{c(
                            'Action'
                        ).t`Inline`}</Button>
                    </span>
                </footer>
            </div>
        </div>
    );
};

export default EditorEmbeddedModal;
