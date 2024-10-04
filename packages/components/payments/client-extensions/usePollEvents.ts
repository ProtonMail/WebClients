import { useRef } from 'react';

import useEventManager from '@proton/components/hooks/useEventManager';
import type { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { EventItemUpdate } from '@proton/shared/lib/helpers/updateCollection';
import isTruthy from '@proton/utils/isTruthy';

export type PollEventsProps = {
    subscribeToProperty: string;
    action: EVENT_ACTIONS;
};

export const maxPollingSteps = 5;
export const interval = 5000;

/**
 * After the Chargebee migration, certain objects aren't immediately updated.
 * For example, it takes a few seconds for updated Subscription object to appear.
 * This time isn't predictable due to async nature of the backend system, so we need to poll for the updated data.
 * */
export const usePollEvents = (props?: PollEventsProps) => {
    const { subscribeToProperty, action } = props ?? {};

    const { call, subscribe } = useEventManager();
    const stoppedRef = useRef(false);

    const callOnce = async (counter: number, unsubscribe?: () => void) => {
        await wait(interval);
        if (stoppedRef.current) {
            return;
        }

        await call();
        if (counter > 0) {
            await callOnce(counter - 1, unsubscribe);
        } else {
            unsubscribe?.();
        }
    };

    const pollEventsMultipleTimes = async () => {
        let unsubscribe: (() => void) | undefined;
        let subscribePromise: Promise<void> | undefined;
        if (!!subscribeToProperty && action !== undefined) {
            subscribePromise = new Promise((resolve) => {
                const definedUnsubscribe = subscribe(async (events: any) => {
                    const propertyEvents: EventItemUpdate<any, any>[] | undefined = events[subscribeToProperty];

                    const event = propertyEvents?.find((event) => event.Action === action);

                    if (!!event) {
                        resolve();
                        definedUnsubscribe();
                        stoppedRef.current = true;
                    }
                });

                unsubscribe = () => {
                    resolve();
                    definedUnsubscribe();
                };
            });
        }

        const callPromise = callOnce(maxPollingSteps - 1, unsubscribe);
        const promises = [subscribePromise, callPromise].filter(isTruthy);
        return Promise.race(promises);
    };

    return pollEventsMultipleTimes;
};
