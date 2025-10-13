import { addHours, getUnixTime } from 'date-fns';
// eslint-disable-next-line import/no-extraneous-dependencies
import { createMemoryHistory } from 'history';

import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { GetBusySlotsResponse } from '@proton/shared/lib/interfaces/calendar';
import { addApiResolver } from '@proton/testing';

import { getStoreWrapper } from '../../test/Store';
import { busySlotsActions, busySlotsSliceName } from './busySlotsSlice';

const busySlotsResponseFaker = ({ dataAccessible }: { dataAccessible: boolean }): GetBusySlotsResponse => {
    if (!dataAccessible) {
        return {
            BusySchedule: {
                BusyTimeSlots: [],
                IsDataAccessible: false,
                More: false,
            },
            Code: 200,
        };
    }

    return {
        BusySchedule: {
            BusyTimeSlots: [
                {
                    Start: getUnixTime(new Date()),
                    End: getUnixTime(addHours(new Date(), 1)),
                },
            ],
            IsDataAccessible: true,
            More: false,
        },
        Code: 200,
    };
};

const getStore = () => {
    const history = createMemoryHistory();
    const { store } = getStoreWrapper({ history });
    return store;
};

describe('busySlotsListener', () => {
    it('Should not run the effect is metadata are not set', () => {
        const store = getStore();

        const attendeeEmail = 'guigui@proton.black';

        expect(store.getState()[busySlotsSliceName].attendees).toEqual([]);

        store.dispatch(busySlotsActions.setAttendees([attendeeEmail]));

        expect(store.getState()[busySlotsSliceName].attendees).toEqual([attendeeEmail]);
        // If color is not set then effect has not been runned
        expect(store.getState()[busySlotsSliceName].attendeeColor[attendeeEmail]).toEqual(undefined);
    });

    it('Should run the effect is metadata are set', async () => {
        const store = getStore();

        const attendeeA = 'guigui@proton.black';
        const attendeeB = 'roro@proton.black';

        const resolverA = addApiResolver(`calendar/v1/${attendeeA}/busy-schedule`, 'get');
        const resolverB = addApiResolver(`calendar/v1/${attendeeB}/busy-schedule`, 'get');

        expect(store.getState()[busySlotsSliceName].attendees).toEqual([]);

        store.dispatch(
            busySlotsActions.setMetadata({
                tzid: 'Europe/Paris',
                view: VIEWS.DAY,
                viewEndDate: getUnixTime(addHours(new Date(), 3)),
                viewStartDate: getUnixTime(new Date()),
            })
        );
        store.dispatch(busySlotsActions.setAttendees([attendeeA, attendeeB]));

        let busyState = store.getState()[busySlotsSliceName];
        expect(busyState.attendees).toEqual([attendeeA, attendeeB]);

        // If color is set then effect starts running
        expect(busyState.attendeeColor[attendeeA]).toBeDefined();
        expect(busyState.attendeeColor[attendeeB]).toBeDefined();

        // If the effect is running then the fetch status should be loading
        expect(busyState.attendeeFetchStatus[attendeeA]).toBe('loading');
        expect(busyState.attendeeFetchStatus[attendeeB]).toBe('loading');

        await wait(100);

        resolverA.resolve(busySlotsResponseFaker({ dataAccessible: true }));
        resolverB.resolve(busySlotsResponseFaker({ dataAccessible: false }));

        await wait(100);

        busyState = store.getState()[busySlotsSliceName];

        expect(busyState.attendeeFetchStatus[attendeeA]).toBe('success');
        expect(busyState.attendeeFetchStatus[attendeeB]).toBe('success');

        expect(busyState.attendeeBusySlots[attendeeA].length).toBeGreaterThan(0);
        expect(busyState.attendeeBusySlots[attendeeB].length).toBe(0);

        expect(busyState.attendeeVisibility[attendeeA]).toBe('visible');
        expect(busyState.attendeeVisibility[attendeeB]).toBe('hidden');
    });
});
