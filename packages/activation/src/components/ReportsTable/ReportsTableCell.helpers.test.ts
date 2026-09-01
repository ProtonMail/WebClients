import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import capitalize from '@proton/utils/capitalize';

import { ApiImportProvider } from '../../api/api.interface';
import { getImportProviderFromApiProvider } from '../../helpers/getImportProviderFromApiProvider';
import { ImportType } from '../../interface';
import { getImportIconByProduct, getImportProductName } from './ReportsTableCell.helpers';

describe('ReportsTableCell.helpers', () => {
    it('getImportProductName - test all types', () => {
        const providers = [ApiImportProvider.IMAP, ApiImportProvider.GOOGLE, ApiImportProvider.OUTLOOK];

        providers.forEach((provider) => {
            const mail = getImportProductName(provider, ImportType.MAIL);
            const calendar = getImportProductName(provider, ImportType.CALENDAR);
            const contact = getImportProductName(provider, ImportType.CONTACTS);
            const drive = getImportProductName(provider, ImportType.DRIVE);
            const mailForwarding = getImportProductName(provider, ImportType.MAIL, true);

            const providerName = getImportProviderFromApiProvider(provider);
            const capitalizedProvider = capitalize(providerName);

            expect(mail).toStrictEqual(`${capitalizedProvider} Mail`);
            expect(calendar).toStrictEqual(`${capitalizedProvider} Calendar`);
            expect(contact).toStrictEqual(`${capitalizedProvider} Contacts`);
            expect(drive).toStrictEqual(`${capitalizedProvider} Drive`);
            expect(mailForwarding).toStrictEqual(`${capitalizedProvider} Mail (forwarding only)`);
        });
    });

    it('getImportIconByProduct - test all types', () => {
        expect(getImportIconByProduct(ImportType.MAIL)).toBe(IcEnvelope);
        expect(getImportIconByProduct(ImportType.CALENDAR)).toBe(IcCalendarGrid);
        expect(getImportIconByProduct(ImportType.CONTACTS)).toBe(IcUsers);
        expect(getImportIconByProduct(ImportType.DRIVE)).toBe(IcBrandProtonDrive);
    });
});
