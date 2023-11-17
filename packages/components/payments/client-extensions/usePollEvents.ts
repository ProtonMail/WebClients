import { wait } from '@proton/shared/lib/helpers/promise';

import { useEventManager } from '../../hooks';

/**
 * After the Chargebee migration, certain objects aren't immediately updated.
 * For example, it takes a few seconds for updated Subscription object to appear.
 * This time isn't predictable due to async nature of the backend system, so we need to poll for the updated data.
 * */
export const usePollEvents = () => {
    const { call } = useEventManager();

    const maxNumber = 5;
    const interval = 5000;

    const callOnce = async (counter: number) => {
        await wait(interval);
        await call();
        if (counter > 0) {
            await callOnce(counter - 1);
        }
    };

    const pollEventsMultipleTimes = async () => {
        await callOnce(maxNumber - 1);
    };

    return pollEventsMultipleTimes;
};
