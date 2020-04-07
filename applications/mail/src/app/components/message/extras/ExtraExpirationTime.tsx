import React, { useState, useEffect } from 'react';
import { Icon } from 'react-components';
import { c } from 'ttag';
import { fromUnixTime, isAfter, differenceInSeconds } from 'date-fns';

import { MessageExtended } from '../../../models/message';

interface Props {
    message: MessageExtended;
}

const formatDelay = (nowDate: Date, expirationDate: Date): string => {
    let delta = differenceInSeconds(expirationDate, nowDate);
    const days = Math.floor(delta / 86400);
    delta -= days * 86400;
    const hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;
    const minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;
    const seconds = delta % 60;
    return [
        {
            diff: days,
            unit: c('Time unit').t`day`,
            units: c('Time unit').t`days`
        },
        {
            diff: hours,
            unit: c('Time unit').t`hour`,
            units: c('Time unit').t`hours`
        },
        {
            diff: minutes,
            unit: c('Time unit').t`minute`,
            units: c('Time unit').t`minutes`
        },
        {
            diff: seconds,
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
            const callback = () => {
                const nowDate = new Date();

                if (isAfter(nowDate, expirationDate)) {
                    setDelayMessage(c('Info').t`This message is expired!`);
                    return;
                }

                setDelayMessage(c('Info').t`This message will expire in ${formatDelay(nowDate, expirationDate)}`);
            };
            const intervalID: NodeJS.Timeout = setInterval(callback, 1000);

            callback();

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
