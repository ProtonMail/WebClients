import capitalize from '@proton/utils/capitalize';

import { ApiImportProvider } from '../../api/api.interface';
import { getImportProviderFromApiProvider } from '../../helpers/getImportProviderFromApiProvider';
import { ImportType } from '../../interface';
import { getImportProductName } from './ReportsTableCell.helpers';

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
});
