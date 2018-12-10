import _ from 'lodash';
import vCard from 'vcf';

import service from '../../../../src/app/contact/factories/vcard';

describe('vcard factory', () => {
    const sanitize = { input: _.identity, message: _.identity };
    const notification = {
        error() {
        }
    };

    let factory;
    let contactA;
    let contactB;
    let mergedContact;

    beforeEach(angular.mock.inject(() => {
        factory = service(notification, sanitize);

        contactA = new vCard();
        contactB = new vCard();

        contactA.set('fn', 'foo bar');
        contactA.set('email', 'foo@bar.com', { group: 'b' });
        contactA.set('categories', 'jeanne', { group: 'b' });
        contactA.set('bday', '20171231');
        contactA.set('tel', '+0123');

        contactB.set('fn', 'bar foo');
        contactB.set('email', 'foo@bar.com', { group: 'a' });
        contactB.set('email', 'bar@foo.com', { group: 'b' });
        contactB.add('email', 'bar2@foo.com', { group: 'a' });
        contactB.set('categories', 'monique', { group: 'a' });
        contactB.add('categories', 'dew', { group: 'b' });
        contactB.set('bday', '20181231');
        contactB.set('tel', '+0123');

        mergedContact = factory.merge([contactA, contactB]);
    }));

    describe('vcard merge', () => {
        it('should merge in the correct order', () => {
            const fn = mergedContact.get('fn');
            expect(fn.map((p) => p.valueOf()).join(' ')).toEqual('foo bar bar foo');
        });

        it('should handle unique value per property', () => {
            const tel = mergedContact.get('tel');
            expect(tel.valueOf()).toEqual('+0123');
        });

        it('should handle unique property', () => {
            const bday = mergedContact.get('bday');
            expect(bday.valueOf()).toEqual('20171231');
        });

        it('should handle unique properties and merge the rest', () => {
            const newContact = factory.merge([contactA, contactB], true);
            const email = newContact.get('email');

            expect(email.map((p) => p.valueOf())).toEqual(['foo@bar.com', 'bar@foo.com', 'bar2@foo.com'] );
        });

        it('should handle case-sensitive properties', () => {
            const contactA = new vCard();
            const contactB = new vCard();

            contactA.set('email', 'foo@bar.com');
            contactB.set('email', 'Foo@bar.com');

            const newContact = factory.merge([contactA, contactB]);
            const emails = newContact.get('email');

            expect(emails.map((e) => e.valueOf()).join(' ')).toEqual('foo@bar.com Foo@bar.com');
        });

        const mapProperties = (list) => {
            return list.map((prop) => ({
                value: prop.valueOf(),
                group: prop.getGroup()
            }));
        };

        it('should handle/rename groups correctly', () => {
            const newContact = factory.merge([contactA, contactB], true);

            const emails = mapProperties(newContact.get('email'));
            const categories = mapProperties(newContact.get('categories'));

            const expectedEmails = [
                { value: 'foo@bar.com', group: 'item1' },
                { value: 'bar@foo.com', group: 'item2' },
                { value: 'bar2@foo.com', group: 'item3' }
            ];

            const expectedCategories = [
                { value: 'jeanne', group: 'item1' },
                { value: 'monique', group: 'item3' },
                { value: 'dew', group: 'item2' }
            ];

            expect(emails).toEqual(expectedEmails);
            expect(categories).toEqual(expectedCategories);
        });
    });
});
