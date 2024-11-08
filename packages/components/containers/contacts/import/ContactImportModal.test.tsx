import { fireEvent } from '@testing-library/react';

import { CryptoProxy } from '@proton/crypto';
import { API_CODES } from '@proton/shared/lib/constants';
import { addApiMock } from '@proton/testing/lib/api';
import range from '@proton/utils/range';

import { clearAll, getCard, mockedCryptoApi, renderWithProviders } from '../tests/render';
import ContactImportModal from './ContactImportModal';

jest.mock('@proton/features/useFeature', () => jest.fn(() => ({ feature: {}, update: jest.fn() })));

describe('ContactImportModal', () => {
    beforeAll(() => {
        CryptoProxy.setEndpoint(mockedCryptoApi);
    });

    beforeEach(clearAll);

    afterAll(async () => {
        await CryptoProxy.releaseEndpoint();
    });

    it('should succeed to import a simple CSV file', async () => {
        const csv = `first name,last name,email-address ,nickname,organization,birthday,home phone,work phone,mobile phone,city,state,zip,country,Job title,personal web page,business website,group membership,Timezone,notes,home
John,Smith,johnsmith@protonmail.com,,Smith Inc.,,123-456-789,,,New Orleans,LA,94958,USA,Head honcho,,,,GMT-7,,
Jane,Doe,jane@example.com,,Example UK,,,(44)12345678,(44)12345678,Brighton,East Sussex,BR7 7HT,UK,,www.customdomain.com,,Brighton kite Flyers,GMT,Likes to party!,
Peter,Rabbit,peter@pm.me,Carrot,,03/12/1969,856-264-4130,123-456-789,123-456-789,Bridgeport,NJ,8014,USA,,,www.customdomain.com,,GMT-4,,
Botman,,botman@pm.me,,,,,,,Skopje,,,,,,,,,,Partizanska`;
        const file = new File([csv], 'test.csv', { type: 'text/csv' });

        const saveRequestSpy = jest.fn();
        const Responses = range(0, 4).map((i) => ({
            Index: 0,
            Response: { Code: API_CODES.SINGLE_SUCCESS, Contact: { ID: `ContactID${i}`, ContactEmails: [] } },
        }));
        addApiMock('contacts/v4/contacts', (args) => {
            saveRequestSpy(args.data);
            return { Responses };
        });

        const { getByText, findByText } = renderWithProviders(<ContactImportModal open={true} />);

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        let importButton = getByText('Import', { selector: 'button' });
        fireEvent.click(importButton);

        await findByText('We have detected', { exact: false });

        importButton = getByText('Import', { selector: 'button' });
        fireEvent.click(importButton);

        await findByText('4/4', { exact: false });

        const sentData = saveRequestSpy.mock.calls[0][0];
        const contact0Cards = sentData.Contacts[0].Cards;
        const signed0 = getCard(contact0Cards, false);

        expect(signed0).toContain('FN;PREF=1:John Smith');
        expect(signed0).toContain('ITEM1.EMAIL;TYPE=;PREF=1:johnsmith@protonmail.com');

        const encrypted0 = getCard(contact0Cards, true);

        expect(encrypted0).toContain('ADR;TYPE=;PREF=1:;;;New Orleans;LA;94958;USA');
        expect(encrypted0).toContain('ORG:Smith Inc.');
        expect(encrypted0).toContain('TEL;TYPE=home;PREF=1:123-456-789');
        expect(encrypted0).toContain('TITLE:Head honcho');
        expect(encrypted0).toContain('TZ:GMT-7');

        const contact1Cards = sentData.Contacts[1].Cards;
        const signed1 = getCard(contact1Cards, false);

        expect(signed1).toContain('FN;PREF=1:Jane Doe');
        expect(signed1).toContain('ITEM1.EMAIL;TYPE=;PREF=1:jane@example.com');

        const encrypted1 = getCard(contact1Cards, true);

        expect(encrypted1).toContain('ADR;TYPE=;PREF=1:;;;Brighton;East Sussex;BR7 7HT;UK');
        expect(encrypted1).toContain('NOTE:Likes to party!');
        expect(encrypted1).toContain('ORG:Example UK');
        expect(encrypted1).toContain('TEL;TYPE=work;PREF=1:(44)12345678');
        expect(encrypted1).toContain('TEL;TYPE=cell;PREF=2:(44)12345678');
        expect(encrypted1).toContain('URL:www.customdomain.com');
        expect(encrypted1).toContain('TZ:GMT');

        const contact2Cards = sentData.Contacts[2].Cards;
        const signed2 = getCard(contact2Cards, false);

        expect(signed2).toContain('FN;PREF=1:Peter Rabbit');
        expect(signed2).toContain('ITEM1.EMAIL;TYPE=;PREF=1:peter@pm.me');

        const encrypted2 = getCard(contact2Cards, true);

        expect(encrypted2).toContain('ADR;TYPE=;PREF=1:;;;Bridgeport;NJ;8014;USA');
        expect(encrypted2).toContain('NOTE:nickname: Carrot');
        expect(encrypted2).toContain('BDAY:19690312');
        expect(encrypted2).toContain('TEL;TYPE=home;PREF=1:856-264-4130');
        expect(encrypted2).toContain('TEL;TYPE=work;PREF=2:123-456-789');
        expect(encrypted2).toContain('TEL;TYPE=cell;PREF=3:123-456-789');
        expect(encrypted2).toContain('URL:www.customdomain.com');
        expect(encrypted2).toContain('TZ:GMT-4');

        const contact3Cards = sentData.Contacts[3].Cards;
        const signed3 = getCard(contact3Cards, false);

        expect(signed3).toContain('FN;PREF=1:Botman');
        expect(signed3).toContain('ITEM1.EMAIL;TYPE=;PREF=1:botman@pm.me');

        const encrypted3 = getCard(contact3Cards, true);

        expect(encrypted3).toContain('ADR;TYPE=;PREF=1:;;;Skopje;;;');
        expect(encrypted3).toContain('NOTE:home: Partizanska');
    });
});
