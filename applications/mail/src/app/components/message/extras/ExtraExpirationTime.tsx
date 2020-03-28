import React, { useState, useEffect } from 'react';
import { Icon } from 'react-components';
import { c } from 'ttag';
import {
    fromUnixTime,
    isAfter,
    differenceInDays,
    differenceInHours,
    differenceInMinutes,
    differenceInSeconds
} from 'date-fns';

import { MessageExtended } from '../../../models/message';
import {} from 'date-fns/esm';

interface Props {
    message: MessageExtended;
}

const formatDelay = (nowDate: Date, expirationDate: Date): string => {
    return [
        { diff: differenceInDays(expirationDate, nowDate), unit: c('Time unit').t`day`, units: c('Time unit').t`days` },
        {
            diff: differenceInHours(expirationDate, nowDate),
            unit: c('Time unit').t`hour`,
            units: c('Time unit').t`hours`
        },
        {
            diff: differenceInMinutes(expirationDate, nowDate),
            unit: c('Time unit').t`minute`,
            units: c('Time unit').t`minutes`
        },
        {
            diff: differenceInSeconds(expirationDate, nowDate),
            unit: c('Time unit').t`second`,
            units: c('Time unit').t`seconds`
        }
    ]
        .reduce((acc: string[], { diff, unit, units }: { diff: number; unit: string; units: string }) => {
            if (diff) {
                acc.push(diff === 1 ? `${diff} ${unit}` : `${diff} ${units}`);
            }
            return acc;
        }, [])
        .join(', ');
};

const ExtraExpirationTime = ({ message }: Props) => {
    const { ExpirationTime } = message.data || {};
    const [delayMessage, setDelayMessage] = useState<string>('');

    useEffect(() => {
        if (ExpirationTime) {
            const expirationDate = fromUnixTime(ExpirationTime);
            const intervalID: NodeJS.Timeout = setInterval(() => {
                const nowDate = new Date();

                if (isAfter(nowDate, expirationDate)) {
                    setDelayMessage(c('Info').t`This message is expired!`);
                    return clearInterval(intervalID);
                }

                setDelayMessage(c('Info').t`This message will expire in ${formatDelay(nowDate, expirationDate)}`);
            }, 1000);

            return () => {
                clearInterval(intervalID);
            };
        }
    }, []);

    if (!ExpirationTime) {
        return null;
    }

    return (
        <div className="bg-global-warning color-white rounded p0-5 mb0-5 flex flex-nowrap">
            <Icon name="expiration" className="flex-item-noshrink mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">{delayMessage}</span>
        </div>
    );
};

export default ExtraExpirationTime;
