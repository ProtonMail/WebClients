import type { EventManagerIntervalTypes } from './eventManagerIntervals';

export const getIntervalTypeFromVisibility = (visible: boolean): EventManagerIntervalTypes => {
    return visible ? 'foreground' : 'background';
};
