import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip, useApi, useEventManager, useNotifications } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { readReceipt } from '@proton/shared/lib/api/messages';
import { isReadReceiptSent, requireReadReceipt } from '@proton/shared/lib/mail/messages';

import { MessageWithOptionalBody } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageWithOptionalBody;
}

const ExtraReadReceipt = ({ message }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { ID } = message;
    const receiptSent = isReadReceiptSent(message);

    if (!requireReadReceipt(message)) {
        return null;
    }

    const handleClick = async () => {
        await api(readReceipt(ID));
        await call();
        createNotification({ text: c('Success').t`Read receipt sent` });
    };

    if (receiptSent) {
        return (
            <span className="mr-2 mb-3 color-success flex on-mobile-w100 flex-align-items-center on-mobile-flex-justify-center flex-items-align-center">
                <Icon name="checkmark" className="flex-item-noshrink my-auto" />
                <span className="ml-2" data-testid="message-view:sent-receipt">{c('Action').t`Read receipt sent`}</span>
            </span>
        );
    }

    return (
        <Tooltip title={c('Info').t`The sender has requested a read receipt.`}>
            <Button
                onClick={() => withLoading(handleClick())}
                disabled={loading}
                data-testid="message-view:send-receipt"
                className="inline-flex flex-align-items-center on-mobile-w100 on-mobile-flex-justify-center mr-0 md:mr-2 mb-3 px-2"
            >
                <Icon name="bell" className="flex-item-noshrink ml-1" />
                <span className="ml-2">{c('Action').t`Send read receipt`}</span>
            </Button>
        </Tooltip>
    );
};

export default ExtraReadReceipt;
