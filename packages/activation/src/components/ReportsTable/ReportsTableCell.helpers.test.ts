import { ImportType } from '@proton/activation/src/interface';

import { getImportIconNameByProduct, getImportProductName } from './ReportsTableCell.helpers';

describe('ReportsTableCell.helpers', () => {
    it('getImportProductName - test all types', () => {
        const mail = getImportProductName(ImportType.MAIL);
        const calendar = getImportProductName(ImportType.CALENDAR);
        const contact = getImportProductName(ImportType.CONTACTS);

        expect(mail).toStrictEqual('Mail');
        expect(calendar).toStrictEqual('Calendar');
        expect(contact).toStrictEqual('Contacts');
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
