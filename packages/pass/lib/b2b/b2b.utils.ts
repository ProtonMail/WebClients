import type { B2BEvent, B2BEventName } from '@proton/pass/types/data/b2b';

export const isB2BEvent =
    <T extends B2BEventName>(name: T) =>
    (event: B2BEvent): event is B2BEvent<T> =>
        event.name === name;
