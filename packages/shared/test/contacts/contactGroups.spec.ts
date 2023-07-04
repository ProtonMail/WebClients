import { getContactGroupsDelayedSaveChanges } from '@proton/shared/lib/contacts/helpers/contactGroup';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

const group1 = 'group1';

const getUserContactEmails = (numberOfContacts: number) => {
    const contactEmails: ContactEmail[] = [];

    for (let i = 0; i < numberOfContacts; i++) {
        const contact = { ID: `contact${i}`, Email: `email${i}@pm.me`, LabelIDs: [group1] } as ContactEmail;
        contactEmails.push(contact);
    }

    return contactEmails;
};

const initialModel = {
    group1: 0,
};

const model = {
    group1: 1,
};

const changes = {
    group1: true,
};

const onLimitReached = jasmine.createSpy();

describe('contactGroups', () => {
    describe('getContactGroupsDelayedSaveChanges', () => {
        it('should be possible to add the contact to the contact group', () => {
            const userContactEmails = getUserContactEmails(99);

            const updatedChanges = getContactGroupsDelayedSaveChanges({
                userContactEmails,
                changes,
                initialModel,
                model,
                onLimitReached,
                mailSettings: {} as MailSettings,
            });

            expect(updatedChanges).toEqual(changes);
        });
    });

    describe('getContactGroupsDelayedSaveChanges', () => {
        it('should not be possible to add the contact to the contact group', () => {
            const userContactEmails = getUserContactEmails(100);

            const updatedChanges = getContactGroupsDelayedSaveChanges({
                userContactEmails,
                changes,
                initialModel,
                model,
                onLimitReached,
                mailSettings: {} as MailSettings,
            });

            expect(updatedChanges).toEqual({});
            expect(onLimitReached).toHaveBeenCalled();
        });
    });
});
