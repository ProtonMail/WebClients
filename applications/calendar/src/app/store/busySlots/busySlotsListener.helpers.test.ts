import { CalendarState } from '../store';
import { getBusyAttendeesToFetch } from './busySlotsListener.helpers';
import type { BusySlotsState } from './busySlotsSlice';

describe('getBusyAttendeesToFetch', () => {
    it('should fetch all the attendees', () => {
        const attendees = ['a', 'b', 'c'];
        const attendeeFetchStatus: BusySlotsState['attendeeFetchStatus'] = {};
        const attendeeVisibility: BusySlotsState['attendeeVisibility'] = {};

        const state = {
            calendarBusySlots: { attendees, attendeeFetchStatus, attendeeVisibility },
        } as CalendarState;

        const toFetch = getBusyAttendeesToFetch(state);

        expect(toFetch).toEqual(['a', 'b', 'c']);
    });

    it('should fetch attendees that are not already fetched or being fetched', () => {
        const attendees = ['a', 'b', 'c'];
        const attendeeFetchStatus: BusySlotsState['attendeeFetchStatus'] = {
            a: 'success',
            b: 'loading',
        };
        const attendeeVisibility: BusySlotsState['attendeeVisibility'] = {};

        const state = {
            calendarBusySlots: { attendees, attendeeFetchStatus, attendeeVisibility },
        } as CalendarState;

        const toFetch = getBusyAttendeesToFetch(state);

        expect(toFetch).toEqual(['c']);
    });

    it('should fetch attendees that are not already fetched or being fetched', () => {
        const attendees = ['a', 'b', 'c'];
        const attendeeFetchStatus: BusySlotsState['attendeeFetchStatus'] = {
            a: 'success',
            b: 'loading',
        };
        const attendeeVisibility: BusySlotsState['attendeeVisibility'] = {};
        const state = {
            calendarBusySlots: { attendees, attendeeFetchStatus, attendeeVisibility },
        } as CalendarState;

        const toFetch = getBusyAttendeesToFetch(state);

        expect(toFetch).toEqual(['c']);
    });
});
