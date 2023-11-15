import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { isToday, isTomorrow } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Prompt, useApi, useEventManager, useModalState, useNotifications } from '@proton/components';
import { cancelSend } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';
import { isScheduled } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { LABEL_IDS_TO_HUMAN, PREVENT_CANCEL_SEND_INTERVAL } from '../../../constants';
import { useOnCompose } from '../../../containers/ComposeProvider';
import { formatDateToHuman } from '../../../helpers/date';
import { ComposeTypes } from '../../../hooks/composer/useCompose';
import { MessageStateWithData } from '../../../logic/messages/messagesTypes';
import { cancelScheduled } from '../../../logic/messages/scheduled/scheduledActions';
import { useAppDispatch } from '../../../logic/store';
import { isScheduledSendTodayMorning } from '../../composer/actions/scheduleSend/helpers';

interface Props {
    message: MessageStateWithData;
}
const ExtraScheduledMessage = ({ message }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const dispatch = useAppDispatch();
    const { createNotification } = useNotifications();
    const location = useLocation();
    const history = useHistory();
    const mailSettings = useMailModel('MailSettings');
    const [loading, setLoading] = useState(false);

    const [nowDate, setNowDate] = useState(() => Date.now());

    const onCompose = useOnCompose();

    const [editScheduleModalProps, setEditScheduleModalOpen] = useModalState();

    const isScheduledMessage = isScheduled(message.data);

    const scheduleDate = isScheduledMessage ? new Date(message.data.Time * 1000) : new Date();

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
        setLoading(true);
        dispatch(cancelScheduled({ ID: message.localID, scheduledAt: message.data.Time }));
        await api(cancelSend(message.data.ID));
        setEditScheduleModalOpen(false);
        setLoading(false);
        await call();

        createNotification({
            text: c('Message notification').t`Scheduling canceled. Message has been moved to Drafts.`,
        });
        onCompose({ type: ComposeTypes.existingDraft, existingDraft: message, fromUndo: false });

        if (location.pathname.includes(LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.SCHEDULED])) {
            const redirectToLoation = hasBit(mailSettings.ShowMoved, SHOW_MOVED.DRAFTS)
                ? MAILBOX_LABEL_IDS.ALL_DRAFTS
                : MAILBOX_LABEL_IDS.DRAFTS;
            history.push(LABEL_IDS_TO_HUMAN[redirectToLoation]);
        }
    };

    const getScheduleBannerMessage = () => {
        if (isScheduleSentShortly) {
            return c('Info').t`This message will be sent shortly`;
        }

        const { dateString, formattedTime } = formatDateToHuman(scheduleDate);

        if (isScheduledSendTodayMorning(scheduleDate)) {
            /*
             * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
             * Full sentence for reference: "This message will be sent in the morning at 11:00 AM"
             */
            return c('Info').t`This message will be sent in the morning at ${formattedTime}`;
        }

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
        <div
            className="bg-info rounded border border-info pr-2 md:pr-1 pb-2 md:pb-1 pt-1 pl-2 mb-3 flex flex-nowrap"
            data-testid="message:schedule-banner"
        >
            <Icon name="paper-plane-horizontal-clock" className="mt-1 ml-0.5 flex-item-noshrink" />
            <span className={clsx(['px-2 flex-item-fluid mt-1', isScheduleSentShortly && 'mb-1'])}>
                {getScheduleBannerMessage()}
            </span>
            {!isScheduleSentShortly ? (
                <span className="flex-item-noshrink flex-align-items-start flex">
                    <Button
                        size="small"
                        color="info"
                        shape="outline"
                        fullWidth
                        className="rounded-sm"
                        onClick={() => setEditScheduleModalOpen(true)}
                        data-testid="message:schedule-banner-edit-button"
                    >{c('Action').t`Edit`}</Button>
                </span>
            ) : null}

            <Prompt
                title={c('Confirm modal title').t`Edit and reschedule`}
                buttons={[
                    <Button
                        disabled={loading}
                        color="norm"
                        onClick={handleUnscheduleMessage}
                        data-testid="message:modal-edit-draft-button"
                    >{c('Action').t`Edit draft`}</Button>,
                    <Button disabled={loading} onClick={editScheduleModalProps.onClose}>{c('Action')
                        .t`Cancel`}</Button>,
                ]}
                {...editScheduleModalProps}
            >
                {c('Info')
                    .t`This message will be moved to Drafts so you can edit it. You'll need to reschedule when it will be sent.`}
            </Prompt>
        </div>
    );
};

export default ExtraScheduledMessage;
