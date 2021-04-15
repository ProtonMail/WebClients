import { addGroup, addPref, getContactCategories, getContactEmails } from '../../lib/contacts/properties';
import { parse } from '../../lib/contacts/vcard';

describe('getContactEmails', () => {
    it('should retrieve contact emails from a vcard contact', () => {
        const properties = addGroup(
            addPref(
                parse(`BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN;PID=1.1:J. Doe
N:Doe;J.;;;
EMAIL;PID=1.1:jdoe@example.com
EMAIL:jdoeeeee@example.com
CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556
CATEGORIES:TRAVEL AGENT
CATEGORIES:INTERNET,IETF,INDUSTRY,INFORMATION TECHNOLOGY
END:VCARD`)
            )
        );
        const result = [
            { email: 'jdoe@example.com', group: 'item1' },
            { email: 'jdoeeeee@example.com', group: 'item2' },
        ];
        expect(getContactEmails(properties)).toEqual(result);
    });

    it('should not complain if contact emails properties do not contain a group', async () => {
        const properties = addPref(
            parse(`BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN;PID=1.1:J. Doe
N:Doe;J.;;;
EMAIL;PID=1.1:jdoe@example.com
EMAIL:jdoeeeee@example.com
CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556
CATEGORIES:TRAVEL AGENT
CATEGORIES:INTERNET,IETF,INDUSTRY,INFORMATION TECHNOLOGY
END:VCARD`)
        );
        const result = [
            { email: 'jdoe@example.com', group: 'item1' },
            { email: 'jdoeeeee@example.com', group: 'item2' },
        ];
        expect(getContactEmails(properties)).toEqual(result);
    });
});

describe('getContactCategories', () => {
    it('should retrieve categories from a vcard contact without groups', () => {
        const properties = addGroup(
            addPref(
                parse(`BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN;PID=1.1:J. Doe
N:Doe;J.;;;
EMAIL;PID=1.1:jdoe@example.com
EMAIL:jdoeeeee@example.com
CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556
CATEGORIES:TRAVEL AGENT
CATEGORIES:INTERNET,IETF,INDUSTRY,INFORMATION TECHNOLOGY
END:VCARD`)
            )
        );
        const result = [
            { name: 'TRAVEL AGENT' },
            { name: 'INTERNET' },
            { name: 'IETF' },
            { name: 'INDUSTRY' },
            { name: 'INFORMATION TECHNOLOGY' },
        ];
        expect(getContactCategories(properties)).toEqual(result);
    });

    it('should retrieve categories from a vcard contact with groups', () => {
        const properties = addGroup(
            addPref(
                parse(`BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN;PID=1.1:J. Doe
N:Doe;J.;;;
ITEM1.EMAIL;PID=1.1:jdoe@example.com
ITEM2.EMAIL:jdoeeeee@example.com
ITEM3.EMAIL:jd@example.com
CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556
ITEM1.CATEGORIES:TRAVEL AGENT
ITEM2.CATEGORIES:INTERNET,IETF,INDUSTRY,INFORMATION TECHNOLOGY
ITEM3.CATEGORIES:TRAVEL AGENT,IETF
END:VCARD`)
            )
        );
        const result = [
            { name: 'TRAVEL AGENT', group: 'item1' },
            { name: 'INTERNET', group: 'item2' },
            { name: 'IETF', group: 'item2' },
            { name: 'INDUSTRY', group: 'item2' },
            { name: 'INFORMATION TECHNOLOGY', group: 'item2' },
            { name: 'TRAVEL AGENT', group: 'item3' },
            { name: 'IETF', group: 'item3' },
        ];
        expect(getContactCategories(properties)).toEqual(result);
    });

    it('should return an empty array when there are no categories in the contact', () => {
        const properties = addGroup(
            addPref(
                parse(`BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN;PID=1.1:J. Doe
N:Doe;J.;;;
ITEM1.EMAIL;PID=1.1:jdoe@example.com
ITEM2.EMAIL:jdoeeeee@example.com
ITEM3.EMAIL:jd@example.com
CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556
END:VCARD`)
            )
        );
        expect(getContactCategories(properties)).toEqual([]);
    });
});
