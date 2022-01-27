import { requireReadReceipt } from '@proton/shared/lib/mail/messages';
import { c } from 'ttag';
import { Icon, InlineLinkButton, useApi, useEventManager, useNotifications, useLoading } from '@proton/components';
import { readReceipt } from '@proton/shared/lib/api/messages';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
}

const ExtraReadReceipt = ({ message }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { ID } = message.data || {};

    if (!requireReadReceipt(message.data)) {
        return null;
    }

    const handleClick = async () => {
        await api(readReceipt(ID));
        await call();
        createNotification({ text: c('Success').t`Read receipt sent` });
    };

    return (
        <div className="bg-warning rounded border p0-5 mb0-5 flex flex-nowrap">
            <Icon name="bell" className="flex-item-noshrink mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">{c('Info').t`The sender has requested a read receipt.`}</span>
            <span className="flex-item-noshrink flex">
                <InlineLinkButton
                    onClick={() => withLoading(handleClick())}
                    disabled={loading}
                    className="color-inherit text-underline"
                    data-testid="message-view:send-receipt"
                >{c('Action').t`Send receipt`}</InlineLinkButton>
            </span>
        </div>
    );
};

export default ExtraReadReceipt;
