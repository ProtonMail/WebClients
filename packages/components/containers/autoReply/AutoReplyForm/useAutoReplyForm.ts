import { useMemo, useState } from 'react';

import { addDays, addHours, fromUnixTime, getUnixTime, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { AutoReplyDuration, DAY_IN_SECONDS, HOUR_IN_SECONDS, MINUTE_IN_SECONDS } from '@proton/shared/lib/constants';
import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromLocalDate,
    fromUTCDate,
    getTimeZoneOptions,
    getTimezone,
    toLocalDate,
    toUTCDate,
} from '@proton/shared/lib/date/timezone';
import { AutoResponder as tsAutoResponder } from '@proton/shared/lib/interfaces';

import { getDurationOptions, getMatchingTimezone } from '../utils';
import { AutoReplyFormDate, AutoReplyFormModel } from './interfaces';

const getDefaultFixedTimes = () => ({
    StartTime: getUnixTime(new Date()),
    EndTime: getUnixTime(addHours(addDays(new Date(), 7), 2)),
});

export const getDefaultAutoResponder = (AutoResponder?: tsAutoResponder) => {
    const timezones = getTimeZoneOptions();

    return {
        ...AutoResponder,
        // Comment copied from anglar:
        // Not translated: it's not editable, foreign people doing international business wouldn't want it to be translated
        // if we make it editable we can translate it again.
        Subject: 'Auto',
        Message: AutoResponder?.Message || c('Autoresponse').t`I'm out of the office with limited access to my email.`,
        Repeat: AutoReplyDuration.FIXED,
        DaysSelected: [],
        IsEnabled: true,
        Zone: getMatchingTimezone(getTimezone(), timezones).value,
        ...getDefaultFixedTimes(),
    };
};

const toDateTimes = (unixTimestamp: number, timezone: string, repeat: AutoReplyDuration) => {
    if (repeat === AutoReplyDuration.PERMANENT) {
        return {};
    }

    if (repeat === AutoReplyDuration.FIXED) {
        const zonedTime = convertUTCDateTimeToZone(fromUTCDate(fromUnixTime(unixTimestamp)), timezone);
        return {
            date: startOfDay(toLocalDate(zonedTime)),
            time: new Date(2000, 0, 1, zonedTime.hours, zonedTime.minutes),
        };
    }

    const day = Math.floor(unixTimestamp / DAY_IN_SECONDS);
    const secondsInDay = unixTimestamp % DAY_IN_SECONDS;
    const hours = Math.floor(secondsInDay / HOUR_IN_SECONDS);
    const minutes = Math.floor((secondsInDay - hours * HOUR_IN_SECONDS) / 60);

    const localTime = new Date(2000, 0, 1, hours, minutes);

    if (repeat === AutoReplyDuration.DAILY) {
        return {
            time: localTime,
        };
    }

    if (repeat === AutoReplyDuration.MONTHLY) {
        return {
            day: day % 31,
            time: localTime,
        };
    }

    if (repeat === AutoReplyDuration.WEEKLY) {
        return {
            day: day % 7,
            time: localTime,
        };
    }
};

export const getMatchingValues = ({ Zone, Repeat }: tsAutoResponder) => {
    const duration = getDurationOptions().find(({ value }) => value === Repeat);
    const timezones = getTimeZoneOptions();
    const matchingTimezone = getMatchingTimezone(Zone, timezones) || getMatchingTimezone(getTimezone(), timezones);

    return {
        timezone: matchingTimezone,
        duration,
    };
};

export const toModel = (
    { Message, StartTime, EndTime, DaysSelected, Subject, IsEnabled }: tsAutoResponder,
    { timezone, duration }: { timezone: string; duration: AutoReplyDuration }
): AutoReplyFormModel => {
    return {
        message: Message,
        daysOfWeek: DaysSelected,
        subject: Subject,
        enabled: IsEnabled,
        duration,
        timezone,
        start: toDateTimes(StartTime, timezone, duration) || {},
        end: toDateTimes(EndTime, timezone, duration) || {},
    };
};

const toUnixTime = (
    { date = new Date(), time = new Date(), day = new Date().getDay() }: AutoReplyFormDate,
    timezone: string,
    repeat: AutoReplyDuration
) => {
    if (repeat === AutoReplyDuration.PERMANENT) {
        return 0;
    }

    const utcUnixTime = time.getHours() * HOUR_IN_SECONDS + time.getMinutes() * MINUTE_IN_SECONDS;

    switch (repeat) {
        case AutoReplyDuration.FIXED:
            return getUnixTime(
                toUTCDate(
                    convertZonedDateTimeToUTC(
                        {
                            ...fromLocalDate(date),
                            hours: time.getHours(),
                            minutes: time.getMinutes(),
                        },
                        timezone
                    )
                )
            );
        case AutoReplyDuration.DAILY:
            return utcUnixTime;
        case AutoReplyDuration.WEEKLY:
            return day * DAY_IN_SECONDS + utcUnixTime;
        case AutoReplyDuration.MONTHLY:
            return day * DAY_IN_SECONDS + utcUnixTime;
        default:
            return utcUnixTime;
    }
};

const toAutoResponder = ({
    message,
    duration,
    daysOfWeek,
    timezone,
    subject,
    start,
    end,
}: AutoReplyFormModel): tsAutoResponder => ({
    Message: message,
    Repeat: duration,
    DaysSelected: daysOfWeek,
    Zone: timezone,
    Subject: subject,
    IsEnabled: true,
    StartTime: toUnixTime(start, timezone, duration),
    EndTime: toUnixTime(end, timezone, duration),
});

type UpdateFunction = (
    value: number | number[] | string | boolean | AutoReplyFormDate,
    extra?: Partial<AutoReplyFormModel>
) => void;

const useAutoReplyForm = (AutoResponder: tsAutoResponder) => {
    const matches = useMemo(() => getMatchingValues(AutoResponder), [AutoResponder]);

    const getInitialModel = () => {
        return toModel(AutoResponder.IsEnabled ? AutoResponder : getDefaultAutoResponder(AutoResponder), {
            timezone: matches.timezone?.value,
            duration: matches.duration?.value || AutoReplyDuration.FIXED,
        });
    };

    const [model, setModel] = useState<AutoReplyFormModel>(getInitialModel());

    const updateModel = (key: string): UpdateFunction => {
        if (key === 'duration') {
            // When changing the duration, reset the model.
            return (value) =>
                setModel({
                    ...toModel(
                        {
                            ...AutoResponder,
                            /**
                             * When switching to fixed repeat duration, reset the start time and end time
                             * to avoid having the date be 1/1/1970
                             */
                            ...(value === AutoReplyDuration.FIXED && AutoResponder.Repeat !== AutoReplyDuration.FIXED
                                ? {
                                      ...getDefaultFixedTimes(),
                                  }
                                : undefined),
                        },
                        {
                            timezone: matches.timezone?.value,
                            duration: value as AutoReplyDuration,
                        }
                    ),
                });
        }

        const [a, b] = key.split('.');

        return (value) => {
            const genericSetter: UpdateFunction = (value, extra?: Partial<AutoReplyFormModel>) =>
                setModel((prev: any) => ({
                    ...prev,
                    [a]: !b
                        ? value
                        : {
                              ...prev[a],
                              [b]: value,
                          },
                    ...extra,
                }));

            // If start date, end date, start time and end time are set, it means that we are using the Fixed duration autoreply type
            if (model.start.date && model.end.date && model.start.time && model.end.time) {
                const valueDate = new Date(value as string);

                /*
                    In Fixed duration, we don't want to have end date before start date.
                    For each cases we set the end date if the change we are making makes the end date before the start date
                 */
                if (key === 'start.date') {
                    if (
                        valueDate.getTime() === model.end.date.getTime() &&
                        model.start.time.getTime() > model.end.time.getTime()
                    ) {
                        return genericSetter(value, { end: { date: model.end.date, time: model.start.time } });
                    }
                    if (valueDate.getTime() > model.end.date.getTime()) {
                        return genericSetter(value, { end: { date: valueDate, time: model.start.time } });
                    }
                }

                if (
                    key === 'start.time' &&
                    model.start.date.getTime() === model.end.date.getTime() &&
                    valueDate.getTime() > model.end.time.getTime()
                ) {
                    return genericSetter(value, { end: { date: model.end.date, time: valueDate } });
                }

                if (key === 'end.date') {
                    if (
                        valueDate.getTime() === model.start.date.getTime() &&
                        model.end.time.getTime() < model.start.time.getTime()
                    ) {
                        return genericSetter(value, { end: { date: model.start.date, time: model.start.time } });
                    }
                    // should not be possible with the dateInput component
                    if (valueDate.getTime() < model.start.date.getTime()) {
                        if (model.end.time.getTime() > model.start.time.getTime()) {
                            return genericSetter(value, { end: { date: model.start.date, time: model.start.time } });
                        }
                        return genericSetter(value, { end: { date: model.start.date, time: model.end.time } });
                    }
                }

                if (
                    key === 'end.time' &&
                    model.start.date.getTime() === model.end.date.getTime() &&
                    valueDate.getTime() < model.start.time.getTime()
                ) {
                    return genericSetter(value, { end: { date: model.end.date, time: model.start.time } });
                }
            }

            return genericSetter(value);
        };
    };

    return {
        model,
        toAutoResponder,
        updateModel,
    };
};

export default useAutoReplyForm;
