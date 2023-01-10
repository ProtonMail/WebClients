import { getDateFromVCardProperty } from '@proton/shared/lib/contacts/property';
import { VCardDateOrText, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

describe('property', () => {
    describe('getDateFromVCardProperty', () => {
        it('should give the expected date when date is valid', () => {
            const date = new Date(2022, 1, 1);
            const vCardProperty = {
                value: {
                    date,
                },
            } as VCardProperty<VCardDateOrText>;

            expect(getDateFromVCardProperty(vCardProperty)).toEqual(date);
        });

        it('should give today date when date is not valid', () => {
            const date = new Date('random string to make it fail');
            const vCardProperty = {
                value: {
                    date,
                },
            } as VCardProperty<VCardDateOrText>;

            expect(getDateFromVCardProperty(vCardProperty)).toEqual(new Date());
        });

        it('should give expected date when text is a valid date', () => {
            const text = 'Jun 9, 2022';
            const vCardProperty = {
                value: {
                    text,
                },
            } as VCardProperty<VCardDateOrText>;

            expect(getDateFromVCardProperty(vCardProperty)).toEqual(new Date(text));
        });

        it('should give today date when text is not a valid date', () => {
            const vCardProperty = {
                value: {
                    text: 'random string to make it fail',
                },
            } as VCardProperty<VCardDateOrText>;

            expect(getDateFromVCardProperty(vCardProperty)).toEqual(new Date());
        });
    });
});
