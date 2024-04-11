import { CalendarState } from '../store';
import { getBusyAttendeesToFetch } from './busyTimeSlotsListener.helpers';
import type { BusyTimeSlotsState } from './busyTimeSlotsSlice';

describe('getBusyAttendeesToFetch', () => {
    it('should fetch all the attendees', () => {
        const attendees = ['a', 'b', 'c'];
        const attendeeFetchStatus: BusyTimeSlotsState['attendeeFetchStatus'] = {};
        const attendeeVisibility: BusyTimeSlotsState['attendeeVisibility'] = {};

        const state = {
            busyTimeSlots: { attendees, attendeeFetchStatus, attendeeVisibility },
        } as CalendarState;

        const toFetch = getBusyAttendeesToFetch(state);

        expect(toFetch).toEqual(['a', 'b', 'c']);
    });

    it('should fetch attendees that are not already fetched or being fetched', () => {
        const attendees = ['a', 'b', 'c'];
        const attendeeFetchStatus: BusyTimeSlotsState['attendeeFetchStatus'] = {
            a: 'success',
            b: 'loading',
        };
        const attendeeVisibility: BusyTimeSlotsState['attendeeVisibility'] = {};

        const state = {
            busyTimeSlots: { attendees, attendeeFetchStatus, attendeeVisibility },
        } as CalendarState;

        const toFetch = getBusyAttendeesToFetch(state);

        expect(toFetch).toEqual(['c']);
    });

    it('should fetch attendees that are not already fetched or being fetched', () => {
        const attendees = ['a', 'b', 'c'];
        const attendeeFetchStatus: BusyTimeSlotsState['attendeeFetchStatus'] = {
            a: 'success',
            b: 'loading',
        };
        const attendeeVisibility: BusyTimeSlotsState['attendeeVisibility'] = {};
        const state = {
            busyTimeSlots: { attendees, attendeeFetchStatus, attendeeVisibility },
        } as CalendarState;

        const toFetch = getBusyAttendeesToFetch(state);

        expect(toFetch).toEqual(['c']);
    });
});
