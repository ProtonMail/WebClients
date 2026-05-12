import { NodeType } from '@proton/drive';

import { getTrashItemAriaLabel } from './trashItemAriaLabel';
import type { TrashItem } from './useTrash.store';

const baseItem: TrashItem = {
    uid: 'volume~node-1',
    name: 'Document.pdf',
    type: NodeType.File,
    mediaType: 'application/pdf',
    trashTime: new Date('2026-03-05T13:30:00Z'),
    modificationTime: new Date('2026-03-01T12:00:00Z'),
    activeRevisionUid: undefined,
    parentUid: undefined,
    rootShareId: undefined,
    haveSignatureIssues: false,
    location: '/My files',
    size: 1234,
};

describe('getTrashItemAriaLabel', () => {
    it('falls back to "Item #<position>" when item is undefined (1-based, with selection)', () => {
        expect(getTrashItemAriaLabel({ item: undefined, isSelected: true, index: 2 })).toBe('Selected, Item #3');
        expect(getTrashItemAriaLabel({ item: undefined, isSelected: false, index: 0 })).toBe('Not selected, Item #1');
    });

    it('starts with "Selected, " when isSelected is true', () => {
        expect(getTrashItemAriaLabel({ item: baseItem, isSelected: true, index: 0 }).startsWith('Selected, ')).toBe(
            true
        );
    });

    it('starts with "Not selected, " when isSelected is false', () => {
        expect(
            getTrashItemAriaLabel({ item: baseItem, isSelected: false, index: 0 }).startsWith('Not selected, ')
        ).toBe(true);
    });

    it('includes the item name', () => {
        expect(getTrashItemAriaLabel({ item: baseItem, isSelected: false, index: 0 })).toContain('Document.pdf');
    });

    it('prefixes location with "Location:"', () => {
        expect(getTrashItemAriaLabel({ item: baseItem, isSelected: false, index: 0 })).toContain('Location: /My files');
    });

    it('omits location when not present', () => {
        const item: TrashItem = { ...baseItem, location: undefined };
        expect(getTrashItemAriaLabel({ item, isSelected: false, index: 0 })).not.toContain('Location:');
    });

    it('prefixes deletion time with "Deleted"', () => {
        expect(getTrashItemAriaLabel({ item: baseItem, isSelected: false, index: 0 })).toMatch(/Deleted [A-Z]/);
    });

    it('omits deletion time when not present', () => {
        const item: TrashItem = { ...baseItem, trashTime: undefined };
        expect(getTrashItemAriaLabel({ item, isSelected: false, index: 0 })).not.toMatch(/Deleted/);
    });

    it('includes humanSize for size', () => {
        expect(getTrashItemAriaLabel({ item: baseItem, isSelected: false, index: 0 })).toMatch(
            /\d+(\.\d+)?\s*(B|KB|MB|GB)/
        );
    });

    it('produces a CSV with the expected ordering', () => {
        const label = getTrashItemAriaLabel({ item: baseItem, isSelected: true, index: 0 });
        expect(label).toMatch(
            /^Selected, Document\.pdf, Location: \/My files, Deleted .+, \d+(\.\d+)?\s*(B|KB|MB|GB)$/
        );
    });
});
