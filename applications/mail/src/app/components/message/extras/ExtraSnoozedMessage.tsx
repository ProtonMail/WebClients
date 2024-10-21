import { useEffect, useMemo, useState } from 'react';

import { isToday, isTomorrow } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { isSnoozed } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { PREVENT_CANCEL_SEND_INTERVAL } from '../../../constants';
import { formatDateToHuman } from '../../../helpers/date';
import { getSnoozeTimeFromElement } from '../../../helpers/snooze';
import useSnooze from '../../../hooks/actions/useSnooze';
import { useGetElementsFromIDs } from '../../../hooks/mailbox/useElements';
import type { MessageStateWithData } from '../../../store/messages/messagesTypes';

interface Props {
    message: MessageStateWithData;
}

const ExtraSnoozedMessage = ({ message }: Props) => {
    const getElementsFromIDs = useGetElementsFromIDs();
    const elements = useMemo(() => getElementsFromIDs([message.data.ConversationID]), [message]);

    const [nowDate, setNowDate] = useState(() => Date.now());

    const { unsnooze, canUnsnooze } = useSnooze();

    const isSnoozedMessage = isSnoozed(message.data);
    const snoozeTime = getSnoozeTimeFromElement(message.data);
    const snoozeDate = isSnoozedMessage && snoozeTime ? new Date(snoozeTime * 1000) : new Date();

    useEffect(() => {
        const handle = setInterval(() => setNowDate(Date.now()), 1000);
        return () => {
            clearInterval(handle);
        };
    }, []);

    const handleUnsnoozeMessage = async () => {
        if (!elements || !elements.length) {
            return;
        }

        unsnooze(elements);
    };

    const getSnoozeBannerMessage = () => {
        const { dateString, formattedTime } = formatDateToHuman(snoozeDate);

        if (isToday(snoozeDate)) {
            /*
             * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
             * Translator: "Snoozed until today, 8:00 AM"
             */
            return c('Info').t`Snoozed until today, ${formattedTime}`;
        }

        if (isTomorrow(snoozeDate)) {
            /*
             * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
             * Translator: "Snoozed until tomorrow, 8:00 AM"
             */
            return c('Info').t`Snoozed until tomorrow, ${formattedTime}`;
        }

        /*
         * translator: The variables here are the following.
         * ${dateString} can be "on Tuesday, May 11" for example
         * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
         * Full sentence for reference: "Snoozed until on Tuesday, May 11 at 8:00 AM"
         */
        return c('Info').t`Snoozed until ${dateString} at ${formattedTime}`;
    };

    // Prevent from cancelling a message that is about to be sent 30s before
    const beforeSendInterval = snoozeDate.getTime() - nowDate;
    const isUnsnoozeShortly = beforeSendInterval < PREVENT_CANCEL_SEND_INTERVAL;

    return (
        <div
            className="rounded border pr-2 md:pr-1 pb-2 md:pb-1 pt-1 pl-2 mb-3 flex flex-nowrap"
            data-testid="message:snooze-banner"
        >
            <Icon name="clock" className="mt-1 ml-0.5 shrink-0 color-warning" />
            <span className={clsx(['px-2 flex-1 mt-1'])}>{getSnoozeBannerMessage()}</span>
            {canUnsnooze && !isUnsnoozeShortly ? (
                <span className="shrink-0 items-start flex">
                    <Button
                        size="small"
                        shape="outline"
                        fullWidth
                        className="rounded-sm"
                        onClick={handleUnsnoozeMessage}
                        data-testid="snooze-banner-edit-button"
                    >{c('Action').t`Unsnooze`}</Button>
                </span>
            ) : null}
        </div>
    );
};

export default ExtraSnoozedMessage;
