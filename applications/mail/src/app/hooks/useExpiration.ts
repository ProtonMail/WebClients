import { useState, useMemo, useEffect } from 'react';
import { c, msgid } from 'ttag';
import { useInterval, useHandler } from '@proton/components';
import { fromUnixTime, isAfter, differenceInSeconds, addSeconds } from 'date-fns';

import { Element } from '../models/element';
import { EXPIRATION_CHECK_FREQUENCY } from '../constants';
import { MessageExtended } from '../models/message';
import { formatDateToHuman } from '../helpers/date';

export const formatDelay = (nowDate: Date, expirationDate: Date): string => {
    let delta = differenceInSeconds(expirationDate, nowDate);
    const daysCountLeft = Math.floor(delta / 86400);
    delta -= daysCountLeft * 86400;
    const hoursCountLeft = Math.floor(delta / 3600) % 24;
    delta -= hoursCountLeft * 3600;
    const minutesCountLeft = Math.floor(delta / 60) % 60;
    delta -= minutesCountLeft * 60;
    const secondsCountLeft = delta % 60;

    return [
        {
            diff: daysCountLeft,
            text: c('Time unit').ngettext(msgid`${daysCountLeft} day`, `${daysCountLeft} days`, daysCountLeft),
        },
        {
            diff: hoursCountLeft,
            text: c('Time unit').ngettext(msgid`${hoursCountLeft} hour`, `${hoursCountLeft} hours`, hoursCountLeft),
        },
        {
            diff: minutesCountLeft,
            text: c('Time unit').ngettext(
                msgid`${minutesCountLeft} minute`,
                `${minutesCountLeft} minutes`,
                minutesCountLeft
            ),
        },
        {
            diff: secondsCountLeft,
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

export const useExpiration = (message: MessageExtended): [boolean, string] => {
    const draftExpirationTime = message.expiresIn ? addSeconds(new Date(), message.expiresIn).getTime() / 1000 : 0;
    const expirationTime = message.data?.ExpirationTime || draftExpirationTime || 0;
    const [delayMessage, setDelayMessage] = useState('');

    const expirationDate = useMemo(() => fromUnixTime(expirationTime), [expirationTime]);

    const handler = useHandler(() => {
        if (!expirationTime) {
            setDelayMessage('');
            return;
        }

        const nowDate = new Date();

        if (isAfter(nowDate, expirationDate)) {
            setDelayMessage(c('Info').t`This message is expired!`);
            return;
        }
        if (draftExpirationTime > 0) {
            const { dateString, formattedTime } = formatDateToHuman(draftExpirationTime * 1000);
            /*
             * translator: The variables here are the following.
             * ${dateString} can be either "on Tuesday, May 11", for example, or "today" or "tomorrow"
             * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
             * Full sentence for reference: "This message will expire on Tuesday, May 11 at 12:30 PM"
             */
            setDelayMessage(c('Info').t`This message will expire ${dateString} at ${formattedTime}`);
        } else {
            const formattedDelay = formatDelay(nowDate, expirationDate);
            setDelayMessage(c('Info').t`This message will expire in ${formattedDelay}`);
        }
    });

    useEffect(() => {
        handler();

        if (expirationTime && !(draftExpirationTime > 0)) {
            const intervalID = window.setInterval(handler, 1000); // eslint-disable-line @typescript-eslint/no-implied-eval
            return () => clearInterval(intervalID);
        }
    }, [expirationTime]);

    return [delayMessage !== '', delayMessage];
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
