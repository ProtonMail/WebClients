import { toICAL } from '../vcard';
import downloadFile from '../../helpers/downloadFile';
import { ContactProperties } from '../../interfaces/contacts';

/**
 * Export a single contact, given as an array of properties
 */
export const singleExport = (properties: ContactProperties) => {
    const filename = properties
        .filter(({ field }) => ['fn', 'email'].includes(field))
        .map(({ value }) => (Array.isArray(value) ? value[0] : value))[0];
    const vcard = toICAL(properties);
    const blob = new Blob([vcard.toString()], { type: 'data:text/plain;charset=utf-8;' });

    downloadFile(blob, `${filename}.vcf`);
};
