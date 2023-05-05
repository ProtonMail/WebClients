import { cleanAddressFromCommas } from '@proton/shared/lib/contacts/helpers/address';
import { VCardAddress } from '@proton/shared/lib/interfaces/contacts/VCard';

describe('contact address helpers', () => {
    describe('cleanAddressFromCommas', () => {
        it('should clean commas from address fields', () => {
            const address: VCardAddress = {
                streetAddress: 'streetAddress',
                extendedAddress: ',,,something, somewhere,,',
                postalCode: '000',
                postOfficeBox: ',,something,somewhere,Geneva,000,,,,,,',
                locality: ',locality,',
                region: ',,,Geneva',
                country: 'Switzerland,,,',
            };

            const expectedAddress: VCardAddress = {
                streetAddress: 'streetAddress',
                extendedAddress: 'something, somewhere',
                postalCode: '000',
                postOfficeBox: 'something,somewhere,Geneva,000',
                locality: 'locality',
                region: 'Geneva',
                country: 'Switzerland',
            };

            expect(cleanAddressFromCommas(address)).toEqual(expectedAddress);
        });
    });
});
