import moment from 'moment-timezone';
import { c } from 'ttag';

export const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

export const AutoReplyDuration = {
    FIXED: 0,
    DAILY: 1,
    WEEKLY: 2,
    MONTHLY: 3,
    PERMANENT: 4
};

export const getDurationOptions = () => [
    {
        text: c('Option').t`Fixed duration`,
        value: AutoReplyDuration.FIXED
    },
    {
        text: c('Option').t`Repeat daily`,
        value: AutoReplyDuration.DAILY
    },
    {
        text: c('Option').t`Repeat weekly`,
        value: AutoReplyDuration.WEEKLY
    },
    {
        text: c('Option').t`Repeat monthly`,
        value: AutoReplyDuration.MONTHLY
    },
    {
        text: c('Option').t`Permanent`,
        value: AutoReplyDuration.PERMANENT
    }
];

export const getWeekdayOptions = () => {
    const firstDayOfWeek = moment.localeData().firstDayOfWeek();
    return moment.weekdays(true).map((text, index) => ({ text, value: (index + firstDayOfWeek) % 7 }));
};

export const getTimeZoneOptions = () => {
    const momentNow = moment(new Date());

    return moment.tz.names().map((name) => {
        const offset = momentNow.tz(name).format('Z');
        return {
            text: `${name}: UTC ${offset}`,
            value: name
        };
    });
};

export const getDaysOfMonthOptions = () => [
    { text: c('Option').t`1st of the month`, value: 0 },
    { text: c('Option').t`2nd of the month`, value: 1 },
    { text: c('Option').t`3rd of the month`, value: 2 },
    { text: c('Option').t`4th of the month`, value: 3 },
    { text: c('Option').t`5th of the month`, value: 4 },
    { text: c('Option').t`6th of the month`, value: 5 },
    { text: c('Option').t`7th of the month`, value: 6 },
    { text: c('Option').t`8th of the month`, value: 7 },
    { text: c('Option').t`9th of the month`, value: 8 },
    { text: c('Option').t`10th of the month`, value: 9 },
    { text: c('Option').t`11th of the month`, value: 10 },
    { text: c('Option').t`12th of the month`, value: 11 },
    { text: c('Option').t`13th of the month`, value: 12 },
    { text: c('Option').t`14th of the month`, value: 13 },
    { text: c('Option').t`15th of the month`, value: 14 },
    { text: c('Option').t`16th of the month`, value: 15 },
    { text: c('Option').t`17th of the month`, value: 16 },
    { text: c('Option').t`18th of the month`, value: 17 },
    { text: c('Option').t`19th of the month`, value: 18 },
    { text: c('Option').t`20th of the month`, value: 19 },
    { text: c('Option').t`21st of the month`, value: 20 },
    { text: c('Option').t`22nd of the month`, value: 21 },
    { text: c('Option').t`23rd of the month`, value: 22 },
    { text: c('Option').t`24th of the month`, value: 23 },
    { text: c('Option').t`25th of the month`, value: 24 },
    { text: c('Option').t`26th of the month`, value: 25 },
    { text: c('Option').t`27th of the month`, value: 26 },
    { text: c('Option').t`28th of the month`, value: 27 },
    { text: c('Option').t`29th of the month`, value: 28 },
    { text: c('Option').t`30th of the month`, value: 29 },
    { text: c('Option').t`31st of the month`, value: 30 }
];
