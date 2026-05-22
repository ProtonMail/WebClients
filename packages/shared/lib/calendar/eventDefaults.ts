import { c } from 'ttag';

export interface DurationOption {
    text: string;
    value: number;
}

export const getCalendarEventDefaultDuration = (options?: {
    shortLabels?: boolean;
    include15Minutes?: boolean;
}): DurationOption[] => {
    const durations: DurationOption[] = [];
    const { shortLabels = false, include15Minutes = false } = options || {};

    if (include15Minutes) {
        durations.push({ text: shortLabels ? c('Duration').t`15m` : c('Duration').t`15 minutes`, value: 15 });
    }

    durations.push(
        { text: shortLabels ? c('Duration').t`30m` : c('Duration').t`30 minutes`, value: 30 },
        { text: shortLabels ? c('Duration').t`60m` : c('Duration').t`60 minutes`, value: 60 },
        { text: shortLabels ? c('Duration').t`90m` : c('Duration').t`90 minutes`, value: 90 },
        { text: shortLabels ? c('Duration').t`120m` : c('Duration').t`120 minutes`, value: 120 }
    );

    return durations;
};
