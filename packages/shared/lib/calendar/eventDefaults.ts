import { c } from 'ttag';

export interface DurationOption {
    text: string;
    value: number;
}

export const getCalendarEventDefaultDuration = (options?: { shortLabels?: boolean }): DurationOption[] => {
    const durations: DurationOption[] = [];
    const { shortLabels = false } = options || {};

    durations.push(
        { text: shortLabels ? c('Duration').t`30m` : c('Duration').t`30 minutes`, value: 30 },
        { text: shortLabels ? c('Duration').t`1h` : c('Duration').t`60 minutes`, value: 60 },
        { text: shortLabels ? c('Duration').t`1.5h` : c('Duration').t`90 minutes`, value: 90 },
        { text: shortLabels ? c('Duration').t`2h` : c('Duration').t`120 minutes`, value: 120 }
    );

    return durations;
};
