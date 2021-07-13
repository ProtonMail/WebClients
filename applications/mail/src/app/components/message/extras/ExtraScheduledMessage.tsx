import React, { useEffect, useState } from 'react';
import { Button, ConfirmModal, Icon, useApi, useEventManager, useModals, useNotifications } from '@proton/components';
import { c } from 'ttag';
import { cancelSend } from '@proton/shared/lib/api/messages';
import { isScheduled } from '@proton/shared/lib/mail/messages';
import { PREVENT_CANCEL_SEND_INTERVAL } from '../../../constants';
import { formatFullDate } from '../../../helpers/date';
import { MessageExtended } from '../../../models/message';
import { useOnCompose } from '../../../containers/ComposeProvider';

interface Props {
    message: MessageExtended;
}
const ExtraScheduledMessage = ({ message }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [nowDate, setNowDate] = useState(() => new Date());

    const onCompose = useOnCompose();
    const { createModal } = useModals();

    const isScheduledMessage = isScheduled(message.data);

    const beforeSendInterval = message.data ? message.data.Time * 1000 - nowDate.getTime() : 0;
    // Prevent from cancelling a message that is about to be sent 30s before
    const isScheduleSentShortly = beforeSendInterval < PREVENT_CANCEL_SEND_INTERVAL;
    const formattedDate =
        isScheduledMessage && message.data
            ? formatFullDate(new Date(message.data.Time * 1000))
            : formatFullDate(new Date());

    useEffect(() => {
        const handle = setInterval(() => setNowDate(new Date()), 1000);
        return () => {
            clearInterval(handle);
        };
    }, []);

    const handleUnscheduleMessage = async () => {
        await api(cancelSend(message.data?.ID));
        await call();
        createNotification({
            text: c('Message notification').t`Scheduling cancelled. Message has been moved to Drafts.`,
        });
        onCompose({ existingDraft: message, fromUndo: false });
    };

    const handleEditScheduled = () => {
        createModal(
            <ConfirmModal
                onConfirm={handleUnscheduleMessage}
                title={c('Confirm modal title').t`Unschedule`}
                cancel={c('Action').t`Cancel`}
                confirm={<Button color="norm" type="submit">{c('Action').t`Unschedule`}</Button>}
            >
                {c('Info')
                    .t`In order to edit this message, the scheduling needs to be cancelled first. It will be moved to your Drafts.`}
            </ConfirmModal>
        );
    };

    return (
        <div className="bg-info rounded p0-5 mb0-5 flex flex-nowrap">
            <Icon name="clock" className="mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">
                {isScheduleSentShortly
                    ? c('Action').t`This message will be sent shortly`
                    : // The variable is the formatted date on which the message will be sent
                      c('Action').t`This message will be sent on ${formattedDate}.`}
            </span>
            {!isScheduleSentShortly ? (
                <button
                    type="button"
                    onClick={handleEditScheduled}
                    className="flex flex-item-noshrink text-underline link mtauto mbauto"
                >{c('Action').t`Edit`}</button>
            ) : null}
        </div>
    );
};

export default ExtraScheduledMessage;
