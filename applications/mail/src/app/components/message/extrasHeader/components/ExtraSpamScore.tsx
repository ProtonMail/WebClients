import { c } from 'ttag';

import { Banner, Button, Href } from '@proton/atoms';
import { Prompt, useApi, useEventManager, useModalState, useNotifications } from '@proton/components';
import { useLoading } from '@proton/hooks';
import type { MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import { markAsHam } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { getBlogURL, getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import {
    isAutoFlaggedPhishing,
    isDMARCValidationFailure,
    isManualFlaggedHam,
    isSuspicious,
} from '@proton/shared/lib/mail/messages';

interface Props {
    message: MessageStateWithData;
}

const ExtraSpamScore = ({ message }: Props) => {
    const [loading, withLoading] = useLoading();
    const { LabelIDs = [] } = message.data || {};
    const { call } = useEventManager();
    const api = useApi();
    const { createNotification } = useNotifications();
    const [spamScoreModalProps, setSpamScoreModalOpen] = useModalState();

    if (isDMARCValidationFailure(message.data)) {
        return (
            <Banner
                link={
                    <Href
                        className="inline-block"
                        href={getKnowledgeBaseUrl('/email-has-failed-its-domains-authentication-requirements-warning')}
                    >
                        {c('Info').t`Learn more`}
                    </Href>
                }
                variant="danger-outline"
                data-testid="spam-banner:dmarc-validation-failure"
            >
                {c('Info')
                    .t`This email has failed its domain's authentication requirements. It may be spoofed or improperly forwarded.`}
            </Banner>
        );
    }

    const isSuspiciousFlagged = isSuspicious(message.data);

    if (
        !(
            (isAutoFlaggedPhishing(message.data) || isSuspiciousFlagged) &&
            (!isManualFlaggedHam(message.data) || LabelIDs.includes(MAILBOX_LABEL_IDS.SPAM))
        )
    ) {
        return null;
    }

    const markAsLegitimate = async () => {
        await api(markAsHam(message.data.ID));
        await call();
        setSpamScoreModalOpen(false);
        createNotification({ text: c('Success').t`Message marked as legitimate` });
    };

    return (
        <>
            <Banner
                link={
                    <Href className="inline-block" href={getBlogURL('/prevent-phishing-attacks')}>
                        {c('Info').t`Learn more`}
                    </Href>
                }
                action={
                    <Button onClick={() => setSpamScoreModalOpen(true)} data-testid="spam-banner:mark-legitimate">
                        {c('Action').t`Mark legitimate`}
                    </Button>
                }
                data-testid="spam-banner:phishing-banner"
                variant="danger"
            >
                <>
                    {isSuspiciousFlagged
                        ? c('Info')
                              .t`Our system flagged this message as a phishing attempt. Please check to ensure that it is legitimate.`
                        : c('Info')
                              .t`Our system flagged this as suspicious. If it is not a phishing or scam email, mark as legitimate.`}
                </>
            </Banner>

            <Prompt
                data-testid="spam-banner:mark-legitimate-prompt"
                title={c('Title').t`Mark email as legitimate`}
                buttons={[
                    <Button loading={loading} color="norm" onClick={() => withLoading(markAsLegitimate())}>{c('Action')
                        .t`Mark legitimate`}</Button>,
                    <Button onClick={spamScoreModalProps.onClose}>{c('Action').t`Cancel`}</Button>,
                ]}
                {...spamScoreModalProps}
            >
                {c('Info')
                    .t`We apologize. This might have been a mistake from our side. Can you please confirm that you want to mark this email as a legitimate one?`}
            </Prompt>
        </>
    );
};

export default ExtraSpamScore;
