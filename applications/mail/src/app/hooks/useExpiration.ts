import { useEffect, useMemo, useState } from 'react';

import {
    addSeconds,
    differenceInHours,
    differenceInSeconds,
    fromUnixTime,
    isAfter,
    isToday,
    isTomorrow,
} from 'date-fns';
import { c, msgid } from 'ttag';

import { useHandler, useInterval } from '@proton/components';

import { EXPIRATION_CHECK_FREQUENCY } from '../constants';
import { formatDateToHuman } from '../helpers/date';
import { MessageState } from '../logic/messages/messagesTypes';
import { Element } from '../models/element';
import { useGetAllMessages, useGetMessage } from './message/useMessage';

const getDateCount = (
    daysCountLeft: number,
    hoursCountLeft: number,
    minutesCountLeft: number,
    secondsCountLeft: number,
    isShortDate?: boolean
): string => {
    const showShortHours = daysCountLeft !== 0 && isShortDate;
    const showShortMinutes = (hoursCountLeft !== 0 || showShortHours) && isShortDate;
    const showShortSeconds = (minutesCountLeft !== 0 || showShortMinutes) && isShortDate;

    return [
        {
            diff: daysCountLeft,
            text: c('Time unit').ngettext(msgid`${daysCountLeft} day`, `${daysCountLeft} days`, daysCountLeft),
        },
        {
            diff: showShortHours ? 0 : hoursCountLeft,
            text: c('Time unit').ngettext(msgid`${hoursCountLeft} hour`, `${hoursCountLeft} hours`, hoursCountLeft),
        },
        {
            diff: showShortMinutes ? 0 : minutesCountLeft,
            text: c('Time unit').ngettext(
                msgid`${minutesCountLeft} minute`,
                `${minutesCountLeft} minutes`,
                minutesCountLeft
            ),
        },
        {
            diff: showShortSeconds ? 0 : secondsCountLeft,
            text: c('Time unit').ngettext(
                msgid`${secondsCountLeft} second`,
                `${secondsCountLeft} seconds`,
                secondsCountLeft
            ),
        },
    ]
        .filter(({ diff }) => diff !== 0)
        .map(({ text }) => text)
        .join(', ');
};

export const formatDelay = (
    nowDate: Date,
    expirationDate: Date,
    willExpireSoon = false
): { formattedDelay: string; formattedDelayShort: string } => {
    let delta = differenceInSeconds(expirationDate, nowDate);
    const daysCountLeft = Math.floor(delta / 86400);
    delta -= daysCountLeft * 86400;
    const hoursCountLeft = Math.floor(delta / 3600) % 24;
    delta -= hoursCountLeft * 3600;
    const minutesCountLeft = Math.floor(delta / 60) % 60;
    delta -= minutesCountLeft * 60;
    const secondsCountLeft = delta % 60;

    /**
     * 1 - When displaying short delay and having a message which will expire soon,
     *      we want to display "Expires in less than XX hour" or minutes or seconds
     * 2 - But if there is 1h59 left, hours count will be 1, and we will display the message "Expires in less than 1 hour",
     *      so we need to add 1 to the count in order to display "Expires in less than 2 hours"
     * 3 - However, if the hour count is 0 (so we have 45 minutes left for example), we don't want to display "Expires in less than 1 hour"
     *      In that case we want to display "Expires in less than 46 minutes", so we don't add 1 when count is 0
     * 4 - Now if hour count is 0 and we have 59 minutes left, we don't want to display "Expires in less than 60 minutes" but "Expires in less than 1 hour"
     * */
    const shortHoursCountLeft =
        willExpireSoon && (hoursCountLeft > 0 || minutesCountLeft === 59) ? hoursCountLeft + 1 : hoursCountLeft;
    const shortMinutesCountLeft =
        willExpireSoon && (minutesCountLeft > 0 || secondsCountLeft === 59) ? minutesCountLeft + 1 : minutesCountLeft;
    const shortSecondsCountLeft = willExpireSoon && secondsCountLeft > 0 ? secondsCountLeft + 1 : secondsCountLeft;

    return {
        formattedDelay: getDateCount(daysCountLeft, hoursCountLeft, minutesCountLeft, secondsCountLeft),
        formattedDelayShort: getDateCount(
            daysCountLeft,
            shortHoursCountLeft,
            shortMinutesCountLeft,
            shortSecondsCountLeft,
            true
        ),
    };
};

const getExpireOnTime = (expirationDate: number, dateString: string, formattedTime: string) => {
    if (isToday(expirationDate)) {
        /*
         * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
         * Full sentence for reference: "This message will expire today at 12:30 PM"
         */
        return c('Info').t`This message will self-destruct today at ${formattedTime}`;
    } else if (isTomorrow(expirationDate)) {
        /*
         * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
         * Full sentence for reference: "This message will expire tomorrow at 12:30 PM"
         */
        return c('Info').t`This message will self-destruct tomorrow at ${formattedTime}`;
    } else {
        /*
         * translator: The variables here are the following.
         * ${dateString} can be either "on Tuesday, May 11", for example, or "today" or "tomorrow"
         * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
         * Full sentence for reference: "This message will expire on Tuesday, May 11 at 12:30 PM"
         */
        return c('Info').t`This message will self-destruct on ${dateString} at ${formattedTime}`;
    }
};

export const useExpiration = (message: MessageState) => {
    // The draft expires in is not a time stamp, it's the number of seconds until the expiration
    // So if we need to display correctly the time remaining, we need to calculate this value once
    const [draftExpirationDate, setDraftExpirationDate] = useState<Date>();

    const draftExpirationTime = message.draftFlags?.expiresIn
        ? addSeconds(new Date(), message.draftFlags?.expiresIn).getTime() / 1000
        : 0;
    const expirationTime = message.data?.ExpirationTime || draftExpirationTime || 0;

    // Message containing the entire expiration date (in tooltip)
    // e.g. Expires in 6 days, 23 hours, 59 minutes, 59 seconds
    const [delayMessage, setDelayMessage] = useState('');

    // Shorter message to display in message view banner
    // e.g. Expires in 3 days; Expires in 4 hours
    const [buttonMessage, setButtonMessage] = useState('');

    // Message containing the entire expiration on date
    // e.g.  This message will expire on Tuesday, May 11 at 12:30 PM
    const [expireOnMessage, setExpireOnMessage] = useState('');
    const [lessThanTwoHours, setLessThanTwoHours] = useState(false);

    const expirationDate = useMemo(() => fromUnixTime(expirationTime), [expirationTime]);

    const isExpiration = delayMessage !== '' || expireOnMessage !== '';

    const setExpirationMessages = (nowDate: Date, expirationDate: Date) => {
        const willExpireSoon = differenceInHours(expirationDate, nowDate) < 2;
        setLessThanTwoHours(willExpireSoon);

        const { formattedDelay, formattedDelayShort } = formatDelay(nowDate, expirationDate, willExpireSoon);
        setDelayMessage(c('Info').t`This message will self-destruct in ${formattedDelay}`);

        if (willExpireSoon) {
            setButtonMessage(c('Info').t`Expires in less than ${formattedDelayShort}`);
        } else {
            setButtonMessage(c('Info').t`Expires in ${formattedDelayShort}`);
        }

        const { dateString, formattedTime } = formatDateToHuman(expirationDate);
        setExpireOnMessage(getExpireOnTime(expirationTime, dateString, formattedTime));
    };

    const handler = useHandler(() => {
        if (!expirationTime) {
            setDelayMessage('');
            setButtonMessage('');
            setExpireOnMessage('');
            return;
        }

        const nowDate = new Date();

        if (isAfter(nowDate, expirationDate)) {
            setDelayMessage(c('Info').t`This message is expired!`);
            return;
        }
        if (draftExpirationTime > 0) {
            // If the draft expiration is not calculated yet, we can calculate it, and we will see the correct Delay value on the UI.
            // Because draftFlags contains the number of seconds until the message expire, we cannot recalculate this each seconds.
            // Otherwise, we would try to calculate the remaining time based on now date, which would always give us the same result.
            if (!draftExpirationDate) {
                setDraftExpirationDate(fromUnixTime(draftExpirationTime));
            } else {
                setExpirationMessages(nowDate, draftExpirationDate);
            }
        } else {
            setExpirationMessages(nowDate, expirationDate);
        }
    });

    useEffect(() => {
        handler();

        if (expirationTime) {
            const intervalID = window.setInterval(handler, 1000); // eslint-disable-line @typescript-eslint/no-implied-eval
            return () => clearInterval(intervalID);
        }
    }, [expirationTime]);

    return {
        isExpiration,
        delayMessage,
        buttonMessage,
        expireOnMessage,
        lessThanTwoHours,
    };
};

export const useExpiringElement = (element: Element, conversationMode = false) => {
    const getAllMessages = useGetAllMessages();
    const getMessage = useGetMessage();

    /**
     *  We need to check if we find an expiration time set in the state.
     *  We could have sent a message recently, and ExpirationTime could not be set already.
     *  If we want to display the expiration icon in the list, we need to check the draft flag in the state
     */
    const expirationTime = useMemo(() => {
        if (element) {
            if (conversationMode) {
                // If the element is a conversation we check all messages to find a message having draft flags and being in the conversation
                const allMessages = getAllMessages();
                const expiringMessageFromConversation = allMessages.find(
                    (message) => message?.data?.ConversationID === element.ID && !!message?.draftFlags?.expiresIn
                );
                const draftExpirationTime = expiringMessageFromConversation?.draftFlags?.expiresIn
                    ? addSeconds(new Date(), expiringMessageFromConversation.draftFlags?.expiresIn).getTime() / 1000
                    : 0;
                const expirationTime =
                    expiringMessageFromConversation?.data?.ExpirationTime || draftExpirationTime || 0;

                return element.ExpirationTime || expirationTime;
            } else {
                // If the element is a message we check if we have an expiration time in draftFlags
                const message = getMessage(element.ID);

                const draftExpirationTime = message?.draftFlags?.expiresIn
                    ? addSeconds(new Date(), message.draftFlags?.expiresIn).getTime() / 1000
                    : 0;
                const expirationTime = message?.data?.ExpirationTime || draftExpirationTime || 0;

                return element.ExpirationTime || expirationTime;
            }
        }
        return undefined;
    }, [element, conversationMode]);

    const hasExpiration = !!expirationTime && expirationTime > 0;

    return { expirationTime, hasExpiration };
};

export const useExpirationCheck = (elements: Element[], expiredCallback: (element: Element) => void) => {
    useInterval(EXPIRATION_CHECK_FREQUENCY, () => {
        const nowDate = new Date();
        elements.forEach((element) => {
            const { ExpirationTime } = element;
            if (ExpirationTime) {
                const expirationDate = fromUnixTime(ExpirationTime);
                if (isAfter(nowDate, expirationDate)) {
                    expiredCallback(element);
                }
            }
        });
    });
};
