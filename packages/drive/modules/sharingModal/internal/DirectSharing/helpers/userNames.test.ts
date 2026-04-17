import type { UserModel } from '@proton/shared/lib/interfaces';

import { getContactNameAndEmail, getDisplayName } from './userNames';

function makeContact(Email: string, Name: string) {
    return {
        ID: Email,
        Email,
        Name,
        ContactID: '',
        LabelIDs: [],
        Defaults: 0,
        Order: 0,
        Type: [],
        LastUsedTime: 0,
    };
}

function makeUser(Email: string, DisplayName: string) {
    return {
        Email,
        DisplayName,
    } as UserModel;
}

describe('getContactNameAndEmail', () => {
    it('returns contact name and email when contact is found', () => {
        const contact = makeContact('Bob@example.com', 'Bob');
        const result = getContactNameAndEmail('bob@example.com', [contact]);
        expect(result.contactName).toBe('Bob');
        expect(result.contactEmail).toBe('Bob@example.com');
    });

    it('returns empty name and original email when no contacts provided', () => {
        const result = getContactNameAndEmail('bob@example.com');
        expect(result.contactName).toBe('');
        expect(result.contactEmail).toBe('bob@example.com');
    });

    it('returns empty name and original email when contact not found', () => {
        const contact = makeContact('alice@example.com', 'Alice');
        const result = getContactNameAndEmail('bob@example.com', [contact]);
        expect(result.contactName).toBe('');
        expect(result.contactEmail).toBe('bob@example.com');
    });

    it('matches contacts case-insensitively via canonicalization', () => {
        const contact = makeContact('Bob@Example.COM', 'Bob Smith');
        const result = getContactNameAndEmail('BOB@example.com', [contact]);
        expect(result.contactName).toBe('Bob Smith');
        expect(result.contactEmail).toBe('Bob@Example.COM');
    });

    it('returns the first matching contact when multiple contacts exist', () => {
        const contacts = [makeContact('alice@example.com', 'Alice'), makeContact('bob@example.com', 'Bob')];
        const result = getContactNameAndEmail('bob@example.com', contacts);
        expect(result.contactName).toBe('Bob');
        expect(result.contactEmail).toBe('bob@example.com');
    });

    it('returns empty name and original email when contacts array is empty', () => {
        const result = getContactNameAndEmail('bob@example.com', []);
        expect(result.contactName).toBe('');
        expect(result.contactEmail).toBe('bob@example.com');
    });
});

describe('getDisplayName', () => {
    it('returns user DisplayName when ownerEmail matches user email', () => {
        const user = makeUser('alice@proton.me', 'Alice');
        const result = getDisplayName({ ownerEmail: 'alice@proton.me', user });
        expect(result).toBe('Alice');
    });

    it('returns contact name when ownerEmail differs from user email and contact is found', () => {
        const user = makeUser('alice@proton.me', 'Alice');
        const contacts = [makeContact('bob@example.com', 'Bob')];
        const result = getDisplayName({ ownerEmail: 'bob@example.com', contactEmails: contacts, user });
        expect(result).toBe('Bob');
    });

    it('returns undefined when ownerEmail differs and contact is not found', () => {
        const user = makeUser('alice@proton.me', 'Alice');
        const contacts = [makeContact('charlie@example.com', 'Charlie')];
        const result = getDisplayName({ ownerEmail: 'bob@example.com', contactEmails: contacts, user });
        expect(result).toBeUndefined();
    });

    it('returns undefined when ownerEmail is undefined', () => {
        const user = makeUser('alice@proton.me', 'Alice');
        const result = getDisplayName({ user });
        expect(result).toBeUndefined();
    });
});
