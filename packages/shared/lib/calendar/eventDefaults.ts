import { c } from 'ttag';

export interface DurationOption {
    text: string;
    value: number;
}

export const getCalendarEventDefaultDuration = (): DurationOption[] => {
    return [
        { text: c('Duration').t`30 minutes`, value: 30 },
        { text: c('Duration').t`60 minutes`, value: 60 },
        { text: c('Duration').t`90 minutes`, value: 90 },
        { text: c('Duration').t`120 minutes`, value: 120 },
    ];
};
