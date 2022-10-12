import { getContactDisplayNameEmail } from '@proton/shared/lib/contacts/contactEmail';

describe('getContactDisplayNameEmail', () => {
    it('displays the email when no name is passed', () => {
        expect(getContactDisplayNameEmail({ email: 'Hello@proton.ch' })).toEqual({
            nameEmail: 'Hello@proton.ch',
            displayOnlyEmail: true,
        });
    });

    it('displays name and email for a "typical" contact', () => {
        expect(getContactDisplayNameEmail({ name: 'My dummy friend', email: 'dummy@proton.ch' })).toEqual({
            nameEmail: 'My dummy friend <dummy@proton.ch>',
            displayOnlyEmail: false,
        });
    });

    it('should use different delimiters', () => {
        expect(
            getContactDisplayNameEmail({
                name: 'My dummy friend',
                email: 'dummy@proton.ch',
                emailDelimiters: ['(', ')'],
            })
        ).toEqual({
            nameEmail: 'My dummy friend (dummy@proton.ch)',
            displayOnlyEmail: false,
        });
    });

    it('should not repeat name and email', () => {
        expect(getContactDisplayNameEmail({ name: 'samesame@proton.ch', email: 'samesame@proton.ch' })).toEqual({
            nameEmail: 'samesame@proton.ch',
            displayOnlyEmail: true,
        });
    });

    it('should normalize when comparing name and email', () => {
        expect(getContactDisplayNameEmail({ name: 'Almost_Same@proton.ch  ', email: 'ALMOST_SAME@proton.ch' })).toEqual(
            {
                nameEmail: 'ALMOST_SAME@proton.ch',
                displayOnlyEmail: true,
            }
        );
    });
});
