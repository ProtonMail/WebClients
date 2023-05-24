// Remove all commas at the beginning and at the end of the string
import { VCardAddress } from '@proton/shared/lib/interfaces/contacts/VCard';

const trimCommas = (string: string) => {
    return string.replace(/(^,+|,+$)/g, '');
};

/**
 * Remove all commas at the beginning and end of each contact address field
 */
export const cleanAddressFromCommas = (address: VCardAddress) => {
    const { streetAddress, extendedAddress, postalCode, postOfficeBox, locality, region, country } = address;

    const trimmed: VCardAddress = {
        streetAddress: trimCommas(streetAddress),
        extendedAddress: trimCommas(extendedAddress),
        postalCode: trimCommas(postalCode),
        postOfficeBox: trimCommas(postOfficeBox),
        locality: trimCommas(locality),
        region: trimCommas(region),
        country: trimCommas(country),
    };

    return trimmed;
};
