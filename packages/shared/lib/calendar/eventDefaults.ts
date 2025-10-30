import { c } from 'ttag';

export interface DurationOption {
    text: string;
    value: number;
}

export const getCalendarEventDefaultDuration = (options?: {
    includeShortDurations?: boolean;
    shortLabels?: boolean;
}): DurationOption[] => {
    const durations: DurationOption[] = [];
    const { includeShortDurations = false, shortLabels = false } = options || {};

    if (includeShortDurations) {
        durations.push({ text: shortLabels ? c('Duration').t`15m` : c('Duration').t`15 minutes`, value: 15 });
    }

    durations.push(
        { text: shortLabels ? c('Duration').t`30m` : c('Duration').t`30 minutes`, value: 30 },
        { text: shortLabels ? c('Duration').t`1h` : c('Duration').t`60 minutes`, value: 60 },
        { text: shortLabels ? c('Duration').t`1.5h` : c('Duration').t`90 minutes`, value: 90 },
        { text: shortLabels ? c('Duration').t`2h` : c('Duration').t`120 minutes`, value: 120 }
    );

    return durations;
};
