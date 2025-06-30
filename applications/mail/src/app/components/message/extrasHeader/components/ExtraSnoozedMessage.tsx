import { useEffect, useMemo, useState } from 'react';

import { isToday, isTomorrow } from 'date-fns';
import { c } from 'ttag';

import { Banner, Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import type { MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import { isSnoozed } from '@proton/shared/lib/mail/messages';

import { SOURCE_ACTION } from 'proton-mail/components/list/list-telemetry/useListTelemetry';

import { PREVENT_CANCEL_SEND_INTERVAL } from '../../../../constants';
import { formatDateToHuman } from '../../../../helpers/date';
import { getSnoozeTimeFromElement } from '../../../../helpers/snooze';
import useSnooze from '../../../../hooks/actions/useSnooze';
import { useGetElementsFromIDs } from '../../../../hooks/mailbox/useElements';

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

        void unsnooze(elements, SOURCE_ACTION.MESSAGE_VIEW);
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
        <Banner
            data-testid="message:snooze-banner"
            variant="info-outline"
            icon={<Icon name="clock" />}
            action={
                canUnsnooze && !isUnsnoozeShortly ? (
                    <Button onClick={handleUnsnoozeMessage} data-testid="snooze-banner-edit-button">{c('Action')
                        .t`Unsnooze`}</Button>
                ) : undefined
            }
        >
            {getSnoozeBannerMessage()}
        </Banner>
    );
};

export default ExtraSnoozedMessage;
