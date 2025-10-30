import { c } from 'ttag';

export interface DurationOption {
    text: string;
    value: number;
}

export const getCalendarEventDefaultDuration = (): DurationOption[] => {
    return [
        { text: c('Duration').t`15m`, value: 15 },
        { text: c('Duration').t`30m`, value: 30 },
        { text: c('Duration').t`1h`, value: 60 },
        { text: c('Duration').t`1.5h`, value: 90 },
        { text: c('Duration').t`2h`, value: 120 },
    ];
};
