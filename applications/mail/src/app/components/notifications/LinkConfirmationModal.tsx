import React, { useState } from 'react';
import { c } from 'ttag';
import { ConfirmModal, Alert, Checkbox, Label, Href, useApi, useEventManager, Button } from 'react-components';
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

    // Not really ellegant but the least bad solution I found to please TS
    const additionalModalProps = { small: false };

    return (
        <ConfirmModal
            onConfirm={handleConfirm}
            onClose={onClose}
            title={c('Title').t`Link confirmation`}
            confirm={
                // translator: this string is only for blind people, it will be vocalized: confirm opening of link https://link.com
                <Button
                    color="norm"
                    type="submit"
                    autoFocus
                    aria-label={c('Action').t`Confirm opening of link ${link}`}
                >
                    {c('Action').t`Confirm`}
                </Button>
            }
            {...rest}
            {...additionalModalProps}
        >
            <Alert type="warning" className="text-break">
                {`${c('Info').t`You are about to open another browser tab and visit:`} `}
                <span className="text-bold">{link}</span>
            </Alert>

            {punyCodeLink && (
                <Alert type="warning">
                    {`${punyCodeLinkText} `}
                    <Href
                        url="https://protonmail.com/support/knowledge-base/homograph-attacks/"
                        title="What are homograph attacks?"
                    >
                        {c('Info').t`Learn more`}
                    </Href>
                </Alert>
            )}

            <Label className="flex">
                <Checkbox checked={dontAskAgain} onChange={() => setDontAskAgain(!dontAskAgain)} />
                {c('Label').t`Do not ask again`}
            </Label>
        </ConfirmModal>
    );
};

export default LinkConfirmationModal;
