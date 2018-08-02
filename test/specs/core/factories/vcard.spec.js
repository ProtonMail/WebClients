import _ from 'lodash';
import service from '../../../../src/app/core/factories/vcard';

import { CONSTANTS } from '../../../../src/app/constants';

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
        factory = service(CONSTANTS, notification, sanitize);

        contactA = new vCard();
        contactB = new vCard();

        contactA.set('fn', 'foo bar');
        contactA.set('email', 'foo@bar.com', { group: 'b' });
        contactA.set('bday', '20171231');
        contactA.set('tel', '+0123');

        contactB.set('fn', 'bar foo');
        contactB.set('email', 'foo@bar.com', { group: 'a' });
        contactB.set('email', 'bar@foo.com', { group: 'b' });
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
            const newContact = factory.merge([contactA, contactB]);
            const email = newContact.get('email');

            expect(email.map((p) => p.valueOf()).join(' ')).toEqual('foo@bar.com bar@foo.com');
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

        it('should handle/rename groups correctly', () => {
            const newContact = factory.merge([contactA, contactB]);
            const [a, b] = newContact.get('email');

            expect(a.valueOf()).toEqual('foo@bar.com');
            expect(a.getGroup()).toEqual('item1');
            expect(b.valueOf()).toEqual('bar@foo.com');
            expect(b.getGroup()).toEqual('item2');
        });
    });
});
