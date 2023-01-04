import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    AlertModal,
    Href,
    Icon,
    useApi,
    useEventManager,
    useLoading,
    useModalState,
    useNotifications,
} from '@proton/components';
import { markAsHam } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { getBlogURL, getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { isAutoFlaggedPhishing, isDMARCValidationFailure, isManualFlaggedHam } from '@proton/shared/lib/mail/messages';

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

    if (isDMARCValidationFailure(message.data)) {
        return (
            <div
                className="bg-norm rounded px0-5 py0-25 mb0-85 flex flex-nowrap"
                data-testid="spam-banner:failed-dmarc-validation"
            >
                <Icon name="exclamation-circle-filled" className="flex-item-noshrink mt0-4 ml0-2 color-danger" />
                <span className="pl0-5 pr0-5 pb0-25 mt0-2 flex-item-fluid">
                    {c('Info')
                        .t`This email has failed its domain's authentication requirements. It may be spoofed or improperly forwarded!`}{' '}
                    <Href
                        url={getKnowledgeBaseUrl('/email-has-failed-its-domains-authentication-requirements-warning')}
                    >
                        {c('Info').t`Learn more`}
                    </Href>
                </span>
            </div>
        );
    }

    if (
        isAutoFlaggedPhishing(message.data) &&
        (!isManualFlaggedHam(message.data) || LabelIDs.includes(MAILBOX_LABEL_IDS.SPAM))
    ) {
        const markAsLegitimate = async () => {
            await api(markAsHam(message.data.ID));
            await call();
            createNotification({ text: c('Success').t`Message marked as legitimate` });
        };

        return (
            <div
                className="bg-danger border border-danger rounded pl0-5 pr0-25 on-mobile-pr0-5 on-mobile-pb0-5 py0-25 mb0-85 flex flex-nowrap"
                data-testid="spam-banner:phishing-banner"
            >
                <Icon name="exclamation-circle-filled" className="flex-item-noshrink ml0-2 mt0-4" />
                <span className="pl0-5 mt0-2 pr0-5 flex-item-fluid">
                    {c('Info')
                        .t`Our system flagged this message as a phishing attempt. Please check that it is legitimate.`}
                    <Href className="pl0-5 pr0-5" url={getBlogURL('/prevent-phishing-attacks')}>
                        {c('Info').t`Learn more`}
                    </Href>
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

                <AlertModal
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
                </AlertModal>
            </div>
        );
    }

    return null;
};

export default ExtraSpamScore;
