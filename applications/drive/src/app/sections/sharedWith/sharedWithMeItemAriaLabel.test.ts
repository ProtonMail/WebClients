import { MemberRole, NodeType } from '@proton/drive';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';

import { getSharedWithMeItemAriaLabel } from './sharedWithMeItemAriaLabel';
import type { BookmarkItem, DirectShareItem, InvitationItem } from './types';
import { ItemType } from './useSharedWithMe.store';

const baseFile = {
    name: 'Document.pdf',
    type: NodeType.File,
    size: 1024,
    mediaType: 'application/pdf',
    activeRevisionUid: undefined,
};

const directShareItem: DirectShareItem = {
    ...baseFile,
    nodeUid: 'volume~node-1',
    shareId: 'share-1',
    itemType: ItemType.DIRECT_SHARE,
    haveSignatureIssues: false,
    role: MemberRole.Viewer,
    directShare: {
        sharedOn: new Date('2026-03-05T13:30:00Z'),
        sharedBy: 'alice@proton.me',
    },
};

const bookmarkItem: BookmarkItem = {
    ...baseFile,
    itemType: ItemType.BOOKMARK,
    bookmark: {
        uid: 'bookmark-1',
        url: 'https://drive.proton.me/urls/abc',
        creationTime: new Date('2026-03-05T13:30:00Z'),
    },
};

const invitationItem: InvitationItem = {
    ...baseFile,
    nodeUid: 'volume~node-1',
    shareId: 'share-1',
    itemType: ItemType.INVITATION,
    invitation: {
        uid: 'invitation-1',
        sharedBy: 'bob@proton.me',
    },
};

const contactEmail = (Email: string, Name: string) =>
    ({ Email, Name, ContactID: 'contact-1', LabelIDs: [] }) as unknown as ContactEmail;

describe('getSharedWithMeItemAriaLabel', () => {
    it('falls back to "Item #<position>" when item is undefined (1-based, with selection)', () => {
        expect(
            getSharedWithMeItemAriaLabel({ item: undefined, isSelected: true, index: 2, contactEmails: undefined })
        ).toBe('Selected, Item #3');
        expect(
            getSharedWithMeItemAriaLabel({ item: undefined, isSelected: false, index: 0, contactEmails: undefined })
        ).toBe('Not selected, Item #1');
    });

    it('starts with "Selected, " when isSelected is true', () => {
        expect(
            getSharedWithMeItemAriaLabel({
                item: directShareItem,
                isSelected: true,
                index: 0,
                contactEmails: undefined,
            }).startsWith('Selected, ')
        ).toBe(true);
    });

    it('starts with "Not selected, " when isSelected is false', () => {
        expect(
            getSharedWithMeItemAriaLabel({
                item: directShareItem,
                isSelected: false,
                index: 0,
                contactEmails: undefined,
            }).startsWith('Not selected, ')
        ).toBe(true);
    });

    describe('direct share item', () => {
        it('uses contact name when an email match exists', () => {
            const contacts = [contactEmail('alice@proton.me', 'Alice Doe')];
            expect(
                getSharedWithMeItemAriaLabel({
                    item: directShareItem,
                    isSelected: false,
                    index: 0,
                    contactEmails: contacts,
                })
            ).toContain('Shared by Alice Doe');
        });

        it('falls back to email when no contact match', () => {
            expect(
                getSharedWithMeItemAriaLabel({ item: directShareItem, isSelected: false, index: 0, contactEmails: [] })
            ).toContain('Shared by alice@proton.me');
        });

        it('falls back to email when contactEmails is undefined', () => {
            expect(
                getSharedWithMeItemAriaLabel({
                    item: directShareItem,
                    isSelected: false,
                    index: 0,
                    contactEmails: undefined,
                })
            ).toContain('Shared by alice@proton.me');
        });

        it('prefixes shared-on with "Shared on"', () => {
            expect(
                getSharedWithMeItemAriaLabel({
                    item: directShareItem,
                    isSelected: false,
                    index: 0,
                    contactEmails: undefined,
                })
            ).toMatch(/Shared on [A-Z]/);
        });
    });

    describe('bookmark (public link) item', () => {
        it('uses "Shared by Public link"', () => {
            expect(
                getSharedWithMeItemAriaLabel({
                    item: bookmarkItem,
                    isSelected: false,
                    index: 0,
                    contactEmails: undefined,
                })
            ).toContain('Shared by Public link');
        });

        it('prefixes shared-on with "Shared on"', () => {
            expect(
                getSharedWithMeItemAriaLabel({
                    item: bookmarkItem,
                    isSelected: false,
                    index: 0,
                    contactEmails: undefined,
                })
            ).toMatch(/Shared on [A-Z]/);
        });
    });

    describe('invitation item', () => {
        it('shows the inviter and "Pending invitation"', () => {
            const contacts = [contactEmail('bob@proton.me', 'Bob Doe')];
            const label = getSharedWithMeItemAriaLabel({
                item: invitationItem,
                isSelected: true,
                index: 0,
                contactEmails: contacts,
            });
            expect(label).toContain('Shared by Bob Doe');
            expect(label).toContain('Pending invitation');
        });

        it('falls back to email when no contact match', () => {
            const label = getSharedWithMeItemAriaLabel({
                item: invitationItem,
                isSelected: false,
                index: 0,
                contactEmails: [],
            });
            expect(label).toContain('Shared by bob@proton.me');
        });

        it('does not include a date for invitations', () => {
            const label = getSharedWithMeItemAriaLabel({
                item: invitationItem,
                isSelected: false,
                index: 0,
                contactEmails: undefined,
            });
            expect(label).not.toMatch(/Shared on/);
        });
    });

    it('produces a CSV with the expected ordering for direct shares', () => {
        const contacts = [contactEmail('alice@proton.me', 'Alice Doe')];
        const label = getSharedWithMeItemAriaLabel({
            item: directShareItem,
            isSelected: true,
            index: 0,
            contactEmails: contacts,
        });
        expect(label).toMatch(/^Selected, Document\.pdf, Shared by Alice Doe, Shared on .+$/);
    });
});
