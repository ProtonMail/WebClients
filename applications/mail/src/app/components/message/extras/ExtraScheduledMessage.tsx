import { useEffect, useState } from 'react';
import {
    AlertModal,
    Button,
    Icon,
    useApi,
    useEventManager,
    useModalState,
    useNotifications,
    classnames,
} from '@proton/components';
import { c } from 'ttag';
import { cancelSend } from '@proton/shared/lib/api/messages';
import { isScheduled } from '@proton/shared/lib/mail/messages';
import { useDispatch } from 'react-redux';
import { isToday, isTomorrow } from 'date-fns';
import { PREVENT_CANCEL_SEND_INTERVAL } from '../../../constants';
import { formatDateToHuman } from '../../../helpers/date';
import { useOnCompose } from '../../../containers/ComposeProvider';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { cancelScheduled } from '../../../logic/messages/draft/messagesDraftActions';

interface Props {
    message: MessageState;
}
const ExtraScheduledMessage = ({ message }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const [nowDate, setNowDate] = useState(() => Date.now());

    const onCompose = useOnCompose();

    const [editScheduleModalProps, setEditScheduleModalOpen] = useModalState();

    const isScheduledMessage = isScheduled(message.data);

    const scheduleDate = isScheduledMessage && message.data ? new Date(message.data.Time * 1000) : new Date();

    const beforeSendInterval = scheduleDate.getTime() - nowDate;
    // Prevent from cancelling a message that is about to be sent 30s before
    const isScheduleSentShortly = beforeSendInterval < PREVENT_CANCEL_SEND_INTERVAL;

    useEffect(() => {
        const handle = setInterval(() => setNowDate(Date.now()), 1000);
        return () => {
            clearInterval(handle);
        };
    }, []);

    const handleUnscheduleMessage = async () => {
        /* Reset the load retry so that if the user schedules again the message and clicks on the view message link,
           the body of message can be loaded. Without the reset, the message can have a loadRetry > 3, which will block
           the loading of the mail body.
         */
        await dispatch(cancelScheduled(message.localID));
        await api(cancelSend(message.data?.ID));
        await call();
        createNotification({
            text: c('Message notification').t`Scheduling cancelled. Message has been moved to Drafts.`,
        });
        onCompose({ existingDraft: message, fromUndo: false });
    };

    const getScheduleBannerMessage = () => {
        if (isScheduleSentShortly) {
            return c('Info').t`This message will be sent shortly`;
        }

        const { dateString, formattedTime } = formatDateToHuman(scheduleDate);

        if (isToday(scheduleDate)) {
            /*
             * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
             * Full sentence for reference: "This message will be sent today at 12:30 PM"
             */
            return c('Info').t`This message will be sent today at ${formattedTime}`;
        }

        if (isTomorrow(scheduleDate)) {
            /*
             * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
             * Full sentence for reference: "This message will be sent tomorrow at 12:30 PM"
             */
            return c('Info').t`This message will be sent tomorrow at ${formattedTime}`;
        }

        /*
         * translator: The variables here are the following.
         * ${dateString} can be "on Tuesday, May 11" for example
         * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
         * Full sentence for reference: "This message will be sent on Tuesday, May 11 at 12:30 PM"
         */
        return c('Info').t`This message will be sent on ${dateString} at ${formattedTime}`;
    };

    return (
        <div className="bg-info rounded px0-5 py0-25 mb0-85 flex flex-nowrap" data-testid="message:schedule-banner">
            <Icon name="clock" className="mt0-4 ml0-2 flex-item-noshrink" />
            <span className={classnames(['pl0-5 pr0-5 flex-item-fluid mt0-25', isScheduleSentShortly && 'mb0-25'])}>
                {getScheduleBannerMessage()}
            </span>
            {!isScheduleSentShortly ? (
                <span className="flex-item-noshrink flex-align-items-start flex color-norm">
                    <Button
                        size="small"
                        color="weak"
                        shape="outline"
                        className="on-mobile-w100 py0-25"
                        onClick={() => setEditScheduleModalOpen(true)}
                        data-testid="message:schedule-banner-edit-button"
                    >{c('Action').t`Edit`}</Button>
                </span>
            ) : null}

            <AlertModal
                title={c('Confirm modal title').t`Edit and reschedule`}
                buttons={[
                    <Button
                        color="norm"
                        onClick={handleUnscheduleMessage}
                        data-testid="message:modal-edit-draft-button"
                    >{c('Action').t`Edit draft`}</Button>,
                    <Button onClick={editScheduleModalProps.onClose}>{c('Action').t`Cancel`}</Button>,
                ]}
                {...editScheduleModalProps}
            >
                {c('Info')
                    .t`This message will be moved to Drafts so you can edit it. You'll need to reschedule when it will be sent.`}
            </AlertModal>
        </div>
    );
};

export default ExtraScheduledMessage;
