import { c } from 'ttag';

import { Button, Tooltip } from '@proton/atoms';
import { Icon, useApi, useEventManager, useNotifications } from '@proton/components';
import { useLoading } from '@proton/hooks';
import type { MessageWithOptionalBody } from '@proton/mail/store/messages/messagesTypes';
import { readReceipt } from '@proton/shared/lib/api/messages';
import { isReadReceiptSent, requireReadReceipt } from '@proton/shared/lib/mail/messages';

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
            <span className="mr-2 mb-3 color-success flex w-full md:w-auto items-center justify-center md:justify-start">
                <Icon name="checkmark" className="shrink-0 my-auto" />
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
                className="inline-flex items-center w-full md:w-auto justify-center md:justify-start mr-0 md:mr-2 mb-3 px-2"
            >
                <Icon name="bell" className="shrink-0 ml-1" />
                <span className="ml-2">{c('Action').t`Send read receipt`}</span>
            </Button>
        </Tooltip>
    );
};

export default ExtraReadReceipt;
