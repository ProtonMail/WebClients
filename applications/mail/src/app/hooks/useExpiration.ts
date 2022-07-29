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
    expirationDate: Date
): { formattedDelay: string; formattedDelayShort: string } => {
    let delta = differenceInSeconds(expirationDate, nowDate);
    const daysCountLeft = Math.floor(delta / 86400);
    delta -= daysCountLeft * 86400;
    const hoursCountLeft = Math.floor(delta / 3600) % 24;
    delta -= hoursCountLeft * 3600;
    const minutesCountLeft = Math.floor(delta / 60) % 60;
    delta -= minutesCountLeft * 60;
    const secondsCountLeft = delta % 60;

    return {
        formattedDelay: getDateCount(daysCountLeft, hoursCountLeft, minutesCountLeft, secondsCountLeft),
        formattedDelayShort: getDateCount(daysCountLeft, hoursCountLeft, minutesCountLeft, secondsCountLeft, true),
    };
};

const getExpireOnTime = (expirationDate: number, dateString: string, formattedTime: string) => {
    if (isToday(expirationDate)) {
        /*
         * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
         * Full sentence for reference: "This message will expire today at 12:30 PM"
         */
        return c('Info').t`This message will expire today at ${formattedTime}`;
    } else if (isTomorrow(expirationDate)) {
        /*
         * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
         * Full sentence for reference: "This message will expire tomorrow at 12:30 PM"
         */
        return c('Info').t`This message will expire tomorrow at ${formattedTime}`;
    } else {
        /*
         * translator: The variables here are the following.
         * ${dateString} can be either "on Tuesday, May 11", for example, or "today" or "tomorrow"
         * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
         * Full sentence for reference: "This message will expire on Tuesday, May 11 at 12:30 PM"
         */
        return c('Info').t`This message will expire on ${dateString} at ${formattedTime}`;
    }
};

export const useExpiration = (message: MessageState) => {
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
            const expirationDate = draftExpirationTime * 1000;
            const { dateString, formattedTime } = formatDateToHuman(expirationDate);

            setExpireOnMessage(getExpireOnTime(expirationDate, dateString, formattedTime));
        } else {
            const willExpireSoon = differenceInHours(expirationDate, nowDate) < 2;
            setLessThanTwoHours(willExpireSoon);

            const { formattedDelay, formattedDelayShort } = formatDelay(nowDate, expirationDate);
            setDelayMessage(c('Info').t`Expires in ${formattedDelay}`);

            if (willExpireSoon) {
                setButtonMessage(c('Info').t`Expires in less than ${formattedDelayShort}`);
            } else {
                setButtonMessage(c('Info').t`Expires in ${formattedDelayShort}`);
            }

            const { dateString, formattedTime } = formatDateToHuman(expirationDate);
            setExpireOnMessage(getExpireOnTime(expirationTime, dateString, formattedTime));
        }
    });

    useEffect(() => {
        handler();

        if (expirationTime && !(draftExpirationTime > 0)) {
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
