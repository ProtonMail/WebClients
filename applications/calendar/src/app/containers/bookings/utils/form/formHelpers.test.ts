import { type BookingFormData, BookingFormValidationReasons, BookingLocation } from '../../bookingsProvider/interface';
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
    });
});
