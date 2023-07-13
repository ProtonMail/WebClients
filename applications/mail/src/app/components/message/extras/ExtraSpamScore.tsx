import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { Icon, Prompt, useApi, useEventManager, useModalState, useNotifications } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { markAsHam } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { getBlogURL, getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import {
    isAutoFlaggedPhishing,
    isDMARCValidationFailure,
    isManualFlaggedHam,
    isSuspicious,
} from '@proton/shared/lib/mail/messages';

import { MessageStateWithData } from '../../../logic/messages/messagesTypes';

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
    const isSuspiciousFlagged = isSuspicious(message.data);

    if (isDMARCValidationFailure(message.data)) {
        return (
            <div
                className="bg-norm rounded px-2 py-1 mb-3 flex flex-nowrap"
                data-testid="spam-banner:failed-dmarc-validation"
            >
                <Icon name="exclamation-circle-filled" className="flex-item-noshrink mt-1 ml-0.5 color-danger" />
                <span className="px-2 pb-1 mt-0.5 flex-item-fluid">
                    {c('Info')
                        .t`This email has failed its domain's authentication requirements. It may be spoofed or improperly forwarded.`}{' '}
                    <Href
                        href={getKnowledgeBaseUrl('/email-has-failed-its-domains-authentication-requirements-warning')}
                    >
                        {c('Info').t`Learn more`}
                    </Href>
                </span>
            </div>
        );
    }

    if (
        (isAutoFlaggedPhishing(message.data) || isSuspiciousFlagged) &&
        (!isManualFlaggedHam(message.data) || LabelIDs.includes(MAILBOX_LABEL_IDS.SPAM))
    ) {
        const markAsLegitimate = async () => {
            await api(markAsHam(message.data.ID));
            await call();
            createNotification({ text: c('Success').t`Message marked as legitimate` });
        };

        return (
            <div
                className="bg-danger border border-danger rounded pr-2 md:pr-1 pb-2 md:pb-1 pt-1 pl-2 mb-3 flex flex-nowrap"
                data-testid="spam-banner:phishing-banner"
            >
                <Icon name="exclamation-circle-filled" className="flex-item-noshrink ml-0.5 mt-1" />
                <span className="px-2 mt-0.5 flex-item-fluid">
                    {isSuspiciousFlagged ? (
                        <>
                            {c('Info')
                                .t`Our system flagged this message as a suspicious email. Please check that it is legitimate before clicking any links or attachments.`}
                        </>
                    ) : (
                        <>
                            {c('Info')
                                .t`Our system flagged this message as a phishing attempt. Please check that it is legitimate.`}
                            <Href className="px-2" href={getBlogURL('/prevent-phishing-attacks')}>
                                {c('Info').t`Learn more`}
                            </Href>
                        </>
                    )}
                </span>
                <span className="flex-item-noshrink flex-align-items-start flex">
                    <Button
                        size="small"
                        color="danger"
                        shape="outline"
                        className="rounded-sm"
                        fullWidth
                        onClick={() => setSpamScoreModalOpen(true)}
                        disabled={loading}
                        data-testid="spam-banner:mark-legitimate"
                    >
                        {c('Action').t`Mark legitimate`}
                    </Button>
                </span>

                <Prompt
                    title={c('Title').t`Mark email as legitimate`}
                    buttons={[
                        <Button color="norm" onClick={() => withLoading(markAsLegitimate())}>{c('Action')
                            .t`Mark legitimate`}</Button>,
                        <Button onClick={spamScoreModalProps.onClose}>{c('Action').t`Cancel`}</Button>,
                    ]}
                    {...spamScoreModalProps}
                >
                    {c('Info')
                        .t`We apologize. This might have been a mistake from our side. Can you please confirm that you want to mark this email as a legitimate one?`}
                </Prompt>
            </div>
        );
    }

    return null;
};

export default ExtraSpamScore;
