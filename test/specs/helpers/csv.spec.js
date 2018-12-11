import vCard from 'vcf';
import { csvToVCard } from '../../../src/helpers/csv';
import contacts from '../../media/contacts-csv';

const file = new File([contacts], 'contacts.csv', { type: 'application/octet-stream' });

describe('csv', () => {
    describe('csvToVCard', () => {
        it('should be a file to run this test', () => {
            expect(file).toEqual(jasmine.any(File));
        });

        it('should reject the Promise if the input is invalid', async () => {
            try {
                await csvToVCard(true);
            } catch (error) {
                return;
            }

            throw new Error('Promise should not be resolved');
        });

        it('should return a Promise<Array(vCard)>', async () => {
            const vcards = await csvToVCard(file);

            expect(Array.isArray(vcards)).toBeTruthy();
            const [vcard] = vcards;
            expect(vcard instanceof vCard).toBeTruthy();
        });

        it('should extract CSV info in a vCard', async () => {
            const [vcard] = await csvToVCard(file);
            const contact = new vCard();

            contact.add('fn', 'Chris Green');
            contact.add('nickname', 'Chris Green');
            contact.add('org', 'Information Technology');
            contact.add('title', 'IT Manager');

            expect(vcard).toEqual(contact);
        });
    });
});
