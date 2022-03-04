import { isReadReceiptSent, requireReadReceipt } from '@proton/shared/lib/mail/messages';
import { c } from 'ttag';
import { Icon, Tooltip, Button, useApi, useEventManager, useNotifications, useLoading } from '@proton/components';
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
    const receiptSent = isReadReceiptSent(message.data);

    if (!requireReadReceipt(message.data)) {
        return null;
    }

    const handleClick = async () => {
        await api(readReceipt(ID));
        await call();
        createNotification({ text: c('Success').t`Read receipt sent` });
    };

    if (receiptSent) {
        return (
            <span className="mr0-5 mb0-85 color-success flex on-mobile-w100 flex-align-items-center on-mobile-flex-justify-center flex-items-align-center">
                <Icon name="check" className="flex-item-noshrink mtauto mbauto" />
                <span className="ml0-5">{c('Action').t`Read receipt sent`}</span>
            </span>
        );
    }

    return (
        <Tooltip title={c('Info').t`The sender has requested a read receipt.`}>
            <Button
                onClick={() => withLoading(handleClick())}
                disabled={loading}
                data-testid="message-view:send-receipt"
                size="small"
                className="inline-flex flex-align-items-center on-mobile-w100 on-mobile-flex-justify-center mr0-5 mb0-85 py0-25"
            >
                <Icon name="bell" className="flex-item-noshrink" />
                <span className="ml0-5">{c('Action').t`Send read receipt`}</span>
            </Button>
        </Tooltip>
    );
};

export default ExtraReadReceipt;
