import type { UnleashClient } from '@proton/unleash/UnleashClient';
import { getStandaloneUnleashClient } from '@proton/unleash/standaloneClient';

import type { EventManagerIntervalTypes, EventManagerIntervals } from './eventManagerIntervals';
import { getTimeoutIntervalsFromUnleash } from './getTimeoutIntervalsFromUnleash';

/**
 * The purpose of this class is to maintain the state of the timeout intervals, and in addition, listen
 * to updates from unleash so that the event manager always knows the latest value.
 */
export class TimeoutIntervalsState {
    private listeners = 0;
    private readonly unleashClient: UnleashClient | undefined;
    private value: EventManagerIntervals;

    public constructor(unleashClient = getStandaloneUnleashClient()) {
        this.unleashClient = unleashClient;
        this.value = getTimeoutIntervalsFromUnleash(unleashClient);
    }

    private handler = () => {
        this.value = getTimeoutIntervalsFromUnleash(this.unleashClient);
    };

    public subscribe = () => {
        // If it's the first time subscribing, add the listener.
        if (!this.listeners) {
            this.unleashClient?.on('update', this.handler);
        }

        this.listeners++;

        return () => {
            this.listeners--;
            if (!this.listeners) {
                this.unleashClient?.off('update', this.handler);
            }
        };
    };

    public isForegroundEqualToBackground() {
        return this.value.foreground === this.value.background;
    }

    public getInterval(type: EventManagerIntervalTypes) {
        return this.value[type];
    }
}

let instance: TimeoutIntervalsState | null = null;

export const getTimeoutIntervalsStateSingleton = (): TimeoutIntervalsState => {
    if (instance === null) {
        instance = new TimeoutIntervalsState();
    }
    return instance;
};
