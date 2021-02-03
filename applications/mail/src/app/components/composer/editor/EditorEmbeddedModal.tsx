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
        <div className="composer-editor-embedded absolute w100 h100 flex flex-justify-center flex-align-items-center">
            <div className="modal modal--smaller">
                <HeaderModal modalTitleID="" hasClose={false} onClose={onClose}>
                    {c('Info').ngettext(msgid`Insert image as`, `Insert images as`, files.length)}
                </HeaderModal>
                <footer className="p2 pt0 flex flex-column flex-nowrap">
                    <span className="mb0-5 w100 flex flex-row flex-align-items-center auto-tiny-mobile">
                        <span className="flex-item-fluid auto-tiny-mobile">
                            <Button
                                className="button--primary w100"
                                onClick={() => onSelect(ATTACHMENT_ACTION.ATTACHMENT)}
                            >
                                {c('Action').t`Attachment`}
                            </Button>
                        </span>
                        <span className="ml1 mr1 w5e auto-tiny-mobile on-tiny-mobile-mt1 on-tiny-mobile-mb1">{c('Info')
                            .t`or`}</span>
                        <span className="flex-item-fluid auto-tiny-mobile">
                            <Button
                                className="button--primary w100"
                                onClick={() => onSelect(ATTACHMENT_ACTION.INLINE)}
                            >{c('Action').t`Inline`}</Button>
                        </span>
                    </span>
                    <span className="w100">
                        <Button className="button--link text-no-decoration" onClick={onClose}>
                            {c('Action').t`Cancel action`}
                        </Button>
                    </span>
                </footer>
            </div>
        </div>
    );
};

export default EditorEmbeddedModal;
