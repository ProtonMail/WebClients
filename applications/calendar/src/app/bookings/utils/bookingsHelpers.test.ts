import { transformAvailableSlotToTimeslot } from './bookingsHelpers';

describe('transformAvailableSlotToTimeslot', () => {
    it('should transform available slot with all fields', () => {
        const availableSlot = {
            ID: 'slot-123',
            StartTime: 1705320000,
            EndTime: 1705323600,
            Timezone: 'America/New_York',
            RRule: 'FREQ=WEEKLY',
            BookingKeyPacket: 'base64encodedpacket',
            DetachedSignature: 'signature',
        };

        const result = transformAvailableSlotToTimeslot(availableSlot);

        expect(result).toEqual({
            id: 'slot-123',
            startTime: 1705320000,
            endTime: 1705323600,
            timezone: 'America/New_York',
            rrule: 'FREQ=WEEKLY',
            detachedSignature: 'signature',
        });
    });

    it('should handle missing RRule field', () => {
        const availableSlot = {
            ID: 'slot-456',
            StartTime: 1705320000,
            EndTime: 1705323600,
            Timezone: 'Europe/Zurich',
            RRule: null,
            BookingKeyPacket: 'base64encodedpacket',
            DetachedSignature: 'signature',
            detachedSignature: 'signature',
        };

        const result = transformAvailableSlotToTimeslot(availableSlot);

        expect(result).toEqual({
            id: 'slot-456',
            startTime: 1705320000,
            endTime: 1705323600,
            timezone: 'Europe/Zurich',
            rrule: undefined,
            detachedSignature: 'signature',
        });
    });

    it('should handle empty string RRule', () => {
        const availableSlot = {
            ID: 'slot-789',
            StartTime: 1705320000,
            EndTime: 1705323600,
            Timezone: 'UTC',
            RRule: '',
            BookingKeyPacket: 'base64encodedpacket',
            DetachedSignature: 'signature',
            detachedSignature: 'signature',
        };

        const result = transformAvailableSlotToTimeslot(availableSlot);

        expect(result.rrule).toBeUndefined();
    });
});
