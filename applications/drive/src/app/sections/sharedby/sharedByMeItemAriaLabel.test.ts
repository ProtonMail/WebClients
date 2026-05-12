import { NodeType } from '@proton/drive';

import { getSharedByMeItemAriaLabel } from './sharedByMeItemAriaLabel';
import type { SharedByMeItem } from './useSharedByMe.store';

const basePublicLink = {
    expirationTime: new Date('2026-03-12T17:00:00Z') as Date | undefined,
    numberOfInitializedDownloads: 12 as number | undefined,
    url: 'https://drive.proton.me/urls/abc',
};

const baseItem: SharedByMeItem = {
    nodeUid: 'volume~node-1',
    name: 'Document.pdf',
    type: NodeType.File,
    mediaType: 'application/pdf',
    activeRevisionUid: undefined,
    size: 1024,
    parentUid: undefined,
    location: '/My files',
    creationTime: new Date('2026-03-01T12:00:00Z'),
    haveSignatureIssues: false,
    publicLink: basePublicLink,
};

describe('getSharedByMeItemAriaLabel', () => {
    it('falls back to "Item #<position>" when item is undefined (1-based, with selection)', () => {
        expect(getSharedByMeItemAriaLabel({ item: undefined, isSelected: true, index: 2 })).toBe('Selected, Item #3');
        expect(getSharedByMeItemAriaLabel({ item: undefined, isSelected: false, index: 0 })).toBe(
            'Not selected, Item #1'
        );
    });

    it('starts with "Selected, " when isSelected is true', () => {
        expect(
            getSharedByMeItemAriaLabel({ item: baseItem, isSelected: true, index: 0 }).startsWith('Selected, ')
        ).toBe(true);
    });

    it('starts with "Not selected, " when isSelected is false', () => {
        expect(
            getSharedByMeItemAriaLabel({ item: baseItem, isSelected: false, index: 0 }).startsWith('Not selected, ')
        ).toBe(true);
    });

    it('includes the item name', () => {
        expect(getSharedByMeItemAriaLabel({ item: baseItem, isSelected: false, index: 0 })).toContain('Document.pdf');
    });

    it('prefixes location with "Location:"', () => {
        expect(getSharedByMeItemAriaLabel({ item: baseItem, isSelected: false, index: 0 })).toContain(
            'Location: /My files'
        );
    });

    it('omits location when undefined', () => {
        const item: SharedByMeItem = { ...baseItem, location: undefined };
        expect(getSharedByMeItemAriaLabel({ item, isSelected: false, index: 0 })).not.toContain('Location:');
    });

    it('prefixes creation time with "Created"', () => {
        expect(getSharedByMeItemAriaLabel({ item: baseItem, isSelected: false, index: 0 })).toMatch(/Created [A-Z]/);
    });

    it('formats download count with "downloads" suffix', () => {
        expect(getSharedByMeItemAriaLabel({ item: baseItem, isSelected: false, index: 0 })).toContain('12 downloads');
    });

    it('uses the placeholder when download count is missing', () => {
        const item: SharedByMeItem = {
            ...baseItem,
            publicLink: { ...basePublicLink, numberOfInitializedDownloads: undefined },
        };
        // formatAccessCount returns the COUNT_PLACEHOLDER ("…") when undefined.
        expect(getSharedByMeItemAriaLabel({ item, isSelected: false, index: 0 })).toContain('… downloads');
    });

    it('says "Never expires" when no expiration time', () => {
        const item: SharedByMeItem = {
            ...baseItem,
            publicLink: { ...basePublicLink, expirationTime: undefined },
        };
        expect(getSharedByMeItemAriaLabel({ item, isSelected: false, index: 0 })).toContain('Never expires');
    });

    it('says "Expires <date>" for an active expiration in the future', () => {
        const now = new Date('2026-03-05T12:00:00Z');
        expect(getSharedByMeItemAriaLabel({ item: baseItem, isSelected: false, index: 0, now })).toMatch(
            /Expires [A-Z]/
        );
    });

    it('says "Expired on <date>" when expiration is in the past', () => {
        const now = new Date('2026-04-01T12:00:00Z');
        expect(getSharedByMeItemAriaLabel({ item: baseItem, isSelected: false, index: 0, now })).toMatch(
            /Expired on [A-Z]/
        );
    });

    it('produces a CSV with the expected ordering', () => {
        const now = new Date('2026-03-05T12:00:00Z');
        const label = getSharedByMeItemAriaLabel({ item: baseItem, isSelected: true, index: 0, now });
        expect(label).toMatch(/^Selected, Document\.pdf, Location: \/My files, Created .+, 12 downloads, Expires .+$/);
    });
});
