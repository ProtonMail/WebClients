import { useState } from 'react';
import { c } from 'ttag';
import { isEdge, isIE11, openNewTab } from '@proton/shared/lib/helpers/browser';
import { updateConfirmLink } from '@proton/shared/lib/api/mailSettings';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';
import { useApi, useEventManager } from '../../hooks';
import { ConfirmModal } from '../modal';
import { Button } from '../button';
import { Alert } from '../alert';
import { Href } from '../link';
import { Checkbox } from '../input';
import { Label } from '../label';

interface Props {
    onClose: () => void;
    link?: string;
    isOutside?: boolean;
}

const LinkConfirmationModal = ({ onClose, link = '', isOutside = false, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [dontAskAgain, setDontAskAgain] = useState(false);

    // https://jira.protontech.ch/browse/SEC-574
    const linkToShow = rtlSanitize(link);

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

        if (dontAskAgain && !isOutside) {
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
                    aria-label={c('Action').t`Confirm opening of link ${linkToShow}`}
                >
                    {c('Action').t`Confirm`}
                </Button>
            }
            {...rest}
            {...additionalModalProps}
        >
            <Alert className="mb1 text-break" type="warning">
                {`${c('Info').t`You are about to open another browser tab and visit:`} `}
                <span className="text-bold">{linkToShow}</span>
            </Alert>

            {punyCodeLink && (
                <Alert className="mb1" type="warning">
                    {`${punyCodeLinkText} `}
                    <Href
                        url="https://protonmail.com/support/knowledge-base/homograph-attacks/"
                        title="What are homograph attacks?"
                    >
                        {c('Info').t`Learn more`}
                    </Href>
                </Alert>
            )}

            {!isOutside && (
                <Label className="flex">
                    <Checkbox checked={dontAskAgain} onChange={() => setDontAskAgain(!dontAskAgain)} />
                    {c('Label').t`Do not ask again`}
                </Label>
            )}
        </ConfirmModal>
    );
};

export default LinkConfirmationModal;
