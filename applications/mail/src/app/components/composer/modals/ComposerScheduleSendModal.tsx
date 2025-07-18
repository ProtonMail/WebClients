import { useEffect, useState } from 'react';

import { addDays, endOfToday, getUnixTime, isToday } from 'date-fns';
import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Href } from '@proton/atoms';
import { DateInputTwo, InputFieldTwo, TimeInput } from '@proton/components';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';
import generateUID from '@proton/utils/generateUID';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { SCHEDULED_MAX_DATE_DAYS } from '../../../constants';
import { getMinScheduleTime } from '../../../helpers/schedule';
import useFutureTimeDate from '../../../hooks/message/useFutureTimeDate';
import { updateScheduled } from '../../../store/messages/scheduled/scheduledActions';
import ComposerInnerModal from './ComposerInnerModal';
import { getChooseDateText } from './helper';

interface Props {
    message: MessageState;
    onClose: () => void;
    onSubmit: (timestamp: number) => void;
}

const ComposerScheduleSendModal = ({ message, onClose, onSubmit }: Props) => {
    const dispatch = useMailDispatch();
    const [userSettings] = useUserSettings();

    const [uid] = useState(generateUID('schedule-send-modal'));

    const defaultDate =
        message && message.draftFlags?.scheduledAt
            ? new Date(message.draftFlags?.scheduledAt * 1000)
            : addDays(new Date(), 1);

    if (!message || (message && !message.draftFlags?.scheduledAt)) {
        defaultDate.setHours(8, 0, 0, 0);
    }

    const maxDateErrorMessage = getChooseDateText(SCHEDULED_MAX_DATE_DAYS);

    const {
        date,
        time,
        disabled,
        handleChangeDate,
        handleChangeTime,
        formatDateInput,
        scheduleDateTime,
        minDate,
        maxDate,
        errorDate,
        errorTime,
    } = useFutureTimeDate({
        defaultDate,
        maxDaysAllowed: SCHEDULED_MAX_DATE_DAYS,
        maxDateErrorMessage,
    });

    useEffect(() => {
        dispatch(updateScheduled({ ID: message.localID, scheduledAt: getUnixTime(scheduleDateTime) }));
    }, [scheduleDateTime]);

    const handleSubmit = () => {
        onClose(); // Close the modal first (see MAILWEB-5895)
        onSubmit(getUnixTime(scheduleDateTime));
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <ComposerInnerModal
            title={c('Title').t`Schedule send`}
            disabled={disabled}
            submit={c('Action').t`Schedule message`}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        >
            <div className="mb-4 flex">
                <span data-testid="composer:schedule-send:custom-modal:title">{c('Description')
                    .t`When do you want your message to be sent?`}</span>{' '}
                <Href className="underline inline-block" href={getKnowledgeBaseUrl('/schedule-email-send')}>{c('Link')
                    .t`Learn more`}</Href>
            </div>
            <div className="flex gap-2 flex-row flex-nowrap">
                <InputFieldTwo
                    as={DateInputTwo}
                    id={`composer-schedule-date-${uid}`}
                    label={c('Label').t`Date`}
                    onChange={handleChangeDate}
                    value={date}
                    min={minDate}
                    weekStartsOn={getWeekStartsOn({ WeekStart: userSettings.WeekStart })}
                    max={maxDate}
                    toFormatter={formatDateInput}
                    preventValueReset
                    error={errorDate}
                    data-testid="composer:schedule-date-input"
                />
                <InputFieldTwo
                    as={TimeInput}
                    id={`composer-schedule-time-${uid}`}
                    label={c('Label').t`Time`}
                    onChange={handleChangeTime}
                    value={time}
                    min={getMinScheduleTime(date)}
                    max={isToday(date) ? endOfToday() : undefined}
                    error={errorTime}
                    data-testid="composer:schedule-time-input"
                />
            </div>
        </ComposerInnerModal>
    );
};

export default ComposerScheduleSendModal;
