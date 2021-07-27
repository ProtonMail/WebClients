import React, { useEffect, useState } from 'react';
import { Button, ConfirmModal, Icon, useApi, useEventManager, useModals, useNotifications } from '@proton/components';
import { c } from 'ttag';
import { cancelSend } from '@proton/shared/lib/api/messages';
import { isScheduled } from '@proton/shared/lib/mail/messages';
import { PREVENT_CANCEL_SEND_INTERVAL } from '../../../constants';
import { formatScheduledDate } from '../../../helpers/date';
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

    const scheduleDate = isScheduledMessage && message.data ? new Date(message.data.Time * 1000) : new Date();

    const beforeSendInterval = scheduleDate.getTime() - nowDate.getTime();
    // Prevent from cancelling a message that is about to be sent 30s before
    const isScheduleSentShortly = beforeSendInterval < PREVENT_CANCEL_SEND_INTERVAL;

    useEffect(() => {
        const handle = setInterval(() => setNowDate(new Date()), 1000);
        return () => {
            clearInterval(handle);
        };
    }, []);

    const handleUnscheduleMessage = async () => {
        /* Reset the load retry so that if the user schedules again the message and clicks on the view message link,
           the body of message can be loaded. Without the reset, the message can have a loadRetry > 3, which will block
           the loading of the mail body.
         */
        message.loadRetry = 0;
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
                title={c('Confirm modal title').t`Edit and reschedule`}
                cancel={c('Action').t`Cancel`}
                confirm={<Button color="norm" type="submit">{c('Action').t`Edit draft`}</Button>}
            >
                {c('Info')
                    .t`This message will be moved to Drafts so you can edit it. You'll need to reschedule when it will be sent.`}
            </ConfirmModal>
        );
    };

    const getScheduleBannerMessage = () => {
        if (isScheduleSentShortly) {
            return c('Info').t`This message will be sent shortly`;
        }

        const { dateString, formattedTime } = formatScheduledDate(scheduleDate);

        /*
         * translator: The variables here are the following.
         * ${dateString} can be either "on Tuesday, May 11", for example, or "today" or "tomorrow"
         * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
         * Full sentence for reference: "Message will be sent on Tuesday, May 11 at 12:30 PM"
         */
        return c('Info').t`This message will be sent ${dateString} at ${formattedTime}`;
    };

    return (
        <div className="bg-info rounded p0-5 mb0-5 flex flex-nowrap">
            <Icon name="clock" className="mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">{getScheduleBannerMessage()}</span>
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
