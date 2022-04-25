import { useState } from 'react';
import { c } from 'ttag';
import { isEdge, isIE11, openNewTab } from '@proton/shared/lib/helpers/browser';
import { updateConfirmLink } from '@proton/shared/lib/api/mailSettings';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';
import { useApi, useEventManager } from '../../hooks';
import { Button } from '../button';
import { Href } from '../link';
import { Checkbox } from '../input';
import { Label } from '../label';
import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../modalTwo';
import { Form } from '../form';

interface Props extends ModalProps {
    link?: string;
    isOutside?: boolean;
    isPhishingAttempt?: boolean;
}

const LinkConfirmationModal = ({ link = '', isOutside = false, isPhishingAttempt = false, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [dontAskAgain, setDontAskAgain] = useState(false);
    const [understandRisk, setUnderstandRisk] = useState(false);

    const { onClose } = rest;

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

        onClose?.();
    };

    const content = isPhishingAttempt ? (
        <>
            {`${c('Info')
                .t`This link leads to a website that might be trying to steal your information, such as passwords and credit card details.`} `}
            <br />
            <span className="text-bold text-break">{linkToShow}</span>

            <Label className="flex">
                <Checkbox checked={understandRisk} onChange={() => setUnderstandRisk(!understandRisk)} />
                {c('Label').t`I understand the risk`}
            </Label>
        </>
    ) : (
        <>
            {`${c('Info').t`You are about to open another browser tab and visit:`} `}
            <span className="text-bold text-break">{linkToShow}</span>

            {punyCodeLink && (
                <>
                    {`${punyCodeLinkText} `}
                    <Href url={getKnowledgeBaseUrl('/homograph-attacks/')} title="What are homograph attacks?">
                        {c('Info').t`Learn more`}
                    </Href>
                </>
            )}

            {!isOutside && (
                <Label className="flex">
                    <Checkbox checked={dontAskAgain} onChange={() => setDontAskAgain(!dontAskAgain)} />
                    {c('Label').t`Do not ask again`}
                </Label>
            )}
        </>
    );

    return (
        <ModalTwo size="large" as={Form} onSubmit={handleConfirm} {...rest}>
            <ModalTwoHeader
                title={
                    isPhishingAttempt ? c('Title').t`Warning: suspected fake website` : c('Title').t`Link confirmation`
                }
            />
            <ModalTwoContent>{content}</ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                {/* translator: this string is only for blind people, it will be vocalized: confirm opening of link https://link.com */}
                <Button
                    color="norm"
                    type="submit"
                    autoFocus
                    aria-label={c('Action').t`Confirm opening of link ${linkToShow}`}
                    disabled={isPhishingAttempt && !understandRisk}
                >
                    {c('Action').t`Confirm`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default LinkConfirmationModal;
