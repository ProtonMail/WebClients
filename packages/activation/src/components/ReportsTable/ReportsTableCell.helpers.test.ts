import { ApiImportProvider } from '@proton/activation/src/api/api.interface';
import { getImportProviderFromApiProvider } from '@proton/activation/src/helpers/getImportProviderFromApiProvider';
import { ImportType } from '@proton/activation/src/interface';
import capitalize from '@proton/utils/capitalize';

import { getImportIconNameByProduct, getImportProductName } from './ReportsTableCell.helpers';

describe('ReportsTableCell.helpers', () => {
    it('getImportProductName - test all types', () => {
        const providers = [ApiImportProvider.IMAP, ApiImportProvider.GOOGLE, ApiImportProvider.OUTLOOK];

        providers.forEach((provider) => {
            const mail = getImportProductName(provider, ImportType.MAIL);
            const calendar = getImportProductName(provider, ImportType.CALENDAR);
            const contact = getImportProductName(provider, ImportType.CONTACTS);
            const mailForwarding = getImportProductName(provider, ImportType.MAIL, true);

            const providerName = getImportProviderFromApiProvider(provider);
            const capitalizedProvider = capitalize(providerName);

            expect(mail).toStrictEqual(`${capitalizedProvider} Mail`);
            expect(calendar).toStrictEqual(`${capitalizedProvider} Calendar`);
            expect(contact).toStrictEqual(`${capitalizedProvider} Contacts`);
            expect(mailForwarding).toStrictEqual(`${capitalizedProvider} Mail (forwarding only)`);
        });
    });

    it('getImportIconNameByProduct - test all types', () => {
        const mail = getImportIconNameByProduct(ImportType.MAIL);
        const calendar = getImportIconNameByProduct(ImportType.CALENDAR);
        const contact = getImportIconNameByProduct(ImportType.CONTACTS);

        expect(mail).toStrictEqual('envelope');
        expect(calendar).toStrictEqual('calendar-grid');
        expect(contact).toStrictEqual('users');
    });
});
