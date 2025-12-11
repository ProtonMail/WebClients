import {
    type BookingFormData,
    BookingFormValidationReasons,
    BookingLocation,
    BookingRangeError,
    MAX_BOOKING_SLOTS,
} from '../../interface';
import { BookingErrorMessages } from '../bookingCopy';
import { validateFormData } from './formHelpers';

describe('booking helpers', () => {
    describe('validateFormData', () => {
        const validForm: BookingFormData = {
            recurring: false,
            summary: 'Page title',
            selectedCalendar: null,
            locationType: BookingLocation.MEET,
            duration: 60,
            timezone: 'Europe/Zurich',
            bookingRanges: [],
            bookingSlots: [
                {
                    id: '10',
                    rangeID: 'rangeID',
                    start: new Date(),
                    end: new Date(),
                    timezone: 'Europe/Zurich',
                },
            ],
        };

        it('should return true if the form is valid', () => {
            const result = validateFormData(validForm);

            expect(result).toEqual(undefined);
        });

        it('should return warning if no title', () => {
            const result = validateFormData({ ...validForm, summary: '' });

            expect(result).toEqual({
                type: 'warning',
                reason: BookingFormValidationReasons.TITLE_REQUIRED,
            });
        });

        it('should return warning if title only has spaces title', () => {
            const result = validateFormData({ ...validForm, summary: '  ' });

            expect(result).toEqual({
                type: 'warning',
                reason: BookingFormValidationReasons.TITLE_REQUIRED,
            });
        });

        it('should return error if no booking slot', () => {
            const result = validateFormData({ ...validForm, bookingSlots: [] });

            expect(result).toEqual({
                type: 'warning',
                reason: BookingFormValidationReasons.TIME_SLOT_REQUIRED,
            });
        });

        it('should return error if booking slots exceed limit', () => {
            const slots = Array.from({ length: MAX_BOOKING_SLOTS }, (_, i) => ({
                id: `${i}`,
                rangeID: 'rangeID',
                start: new Date(),
                end: new Date(),
                timezone: 'Europe/Zurich',
            }));
            const result = validateFormData({ ...validForm, bookingSlots: slots });

            expect(result).toEqual({
                type: 'error',
                reason: BookingFormValidationReasons.TIME_SLOT_LIMIT,
                message: BookingErrorMessages.maxSlotsReached(MAX_BOOKING_SLOTS),
            });
        });

        it('should return warning if location type is in-person but location is missing', () => {
            const result = validateFormData({ ...validForm, locationType: BookingLocation.IN_PERSON, location: '' });

            expect(result).toEqual({
                type: 'warning',
                reason: BookingFormValidationReasons.MISSING_LOCATION,
            });
        });

        it('should return warning if booking range has an error', () => {
            const result = validateFormData({
                ...validForm,
                bookingRanges: [
                    {
                        id: '1',
                        start: new Date(),
                        end: new Date(),
                        timezone: 'Europe/Zurich',
                        error: BookingRangeError.TOO_SHORT,
                    },
                ],
            });

            expect(result).toEqual({
                type: 'warning',
                reason: BookingFormValidationReasons.RANGE_ERROR,
            });
        });
    });
});
