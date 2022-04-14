import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import {
    Icon,
    Href,
    Button,
    useLoading,
    useEventManager,
    useApi,
    useNotifications,
    AlertModal,
    useModalState,
} from '@proton/components';
import { c } from 'ttag';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { markAsHam } from '@proton/shared/lib/api/messages';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
}

const ExtraSpamScore = ({ message }: Props) => {
    const [loading, withLoading] = useLoading();
    const { Flags, LabelIDs = [] } = message.data || {};
    const { call } = useEventManager();
    const api = useApi();
    const { createNotification } = useNotifications();

    const [spamScoreModalProps, setSpamScoreModalOpen] = useModalState();

    if (hasBit(Flags, MESSAGE_FLAGS.FLAG_DMARC_FAIL)) {
        return (
            <div className="bg-norm border rounded px0-5 py0-25 mb0-85 flex flex-nowrap">
                <Icon name="circle-exclamation-filled" className="flex-item-noshrink mt0-4 ml0-2 color-danger" />
                <span className="pl0-5 pr0-5 pb0-25 mt0-2 flex-item-fluid">
                    {c('Info')
                        .t`This email has failed its domain's authentication requirements. It may be spoofed or improperly forwarded!`}{' '}
                    <Href
                        className="text-underline color-inherit"
                        url="https://protonmail.com/support/knowledge-base/email-has-failed-its-domains-authentication-requirements-warning/"
                    >
                        {c('Info').t`Learn more`}
                    </Href>
                </span>
            </div>
        );
    }

    if (
        hasBit(Flags, MESSAGE_FLAGS.FLAG_PHISHING_AUTO) &&
        (!hasBit(Flags, MESSAGE_FLAGS.FLAG_HAM_MANUAL) || LabelIDs.includes(MAILBOX_LABEL_IDS.SPAM))
    ) {
        const markAsLegitimate = async () => {
            await api(markAsHam(message.data?.ID));
            await call();
            createNotification({ text: c('Success').t`Message marked as legitimate` });
        };

        return (
            <div className="bg-norm border rounded px0-5 py0-25 mb0-85 flex flex-nowrap" data-testid="phishing-banner">
                <Icon name="circle-exclamation-filled" className="flex-item-noshrink ml0-2 mt0-4 color-danger" />
                <span className="pl0-5 mt0-2 pr0-5 flex-item-fluid">
                    {c('Info')
                        .t`Our system flagged this message as a phishing attempt. Please check that it is legitimate.`}
                    <Href className="pl0-5 pr0-5" url="https://protonmail.com/blog/prevent-phishing-attacks/">
                        {c('Info').t`Learn more`}
                    </Href>
                </span>
                <span className="flex-item-noshrink flex-align-items-start flex">
                    <Button
                        size="small"
                        color="weak"
                        shape="outline"
                        className="on-mobile-w100 py0-25"
                        onClick={() => setSpamScoreModalOpen(true)}
                        disabled={loading}
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
