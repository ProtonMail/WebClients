import React, { useState } from 'react';
import { c } from 'ttag';
import { ConfirmModal, Alert, Checkbox, Label, Href, useApi, useEventManager } from 'react-components';
import { isEdge, isIE11, openNewTab } from 'proton-shared/lib/helpers/browser';
import { updateConfirmLink } from 'proton-shared/lib/api/mailSettings';

interface Props {
    onClose: () => void;
    link?: string;
}

const LinkConfirmationModal = ({ onClose, link = '', ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [dontAskAgain, setDontAskAgain] = useState(false);

    // Both are not able to open the link
    const punyCodeLink = /:\/\/xn--/.test(link);

    const punyCodeLinkText =
        isEdge() || isIE11()
            ? c('Info')
                  .t`This link may be a homograph attack and cannot be opened by Internet Explorer and Edge browsers. If you are certain the link is legitimate, please use a different browser to open it.`
            : c('Info')
                  .t`This link may be a homograph attack. Please verify this is the link you wish to visit, or don't open it.`;

    const handleConfirm = async () => {
        openNewTab(link);

        if (dontAskAgain) {
            await api(updateConfirmLink(0));
            await call();
        }
    };

    return (
        <ConfirmModal onConfirm={handleConfirm} onClose={onClose} title={c('Title').t`Link confirmation`} {...rest}>
            <Alert type="warning">
                {c('Info').t`You are about to open another browser tab and visit:`}
                <span className="bold">{link}</span>
            </Alert>

            {punyCodeLink && (
                <Alert type="warning">
                    {punyCodeLinkText}
                    <Href
                        url="https://protonmail.com/support/knowledge-base/homograph-attacks/"
                        title="What are homograph attacks?"
                    >
                        {c('Info').t`Learn more`}
                    </Href>
                </Alert>
            )}

            <Label>
                <Checkbox checked={dontAskAgain} onChange={() => setDontAskAgain(!dontAskAgain)} />
                {c('Label').t`Do not ask again`}
            </Label>
        </ConfirmModal>
    );
};

export default LinkConfirmationModal;
