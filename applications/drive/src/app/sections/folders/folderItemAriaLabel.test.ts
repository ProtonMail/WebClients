import { MemberRole, NodeType } from '@proton/drive';

import { getFolderItemAriaLabel } from './folderItemAriaLabel';
import type { FolderViewItem } from './useFolder.store';

const baseItem: FolderViewItem = {
    uid: 'volume~node-1',
    name: 'Document.pdf',
    rootShareId: 'share-id',
    parentLinkId: 'parent-link',
    linkId: 'link-1',
    volumeId: 'volume-1',
    activeRevisionUid: undefined,
    id: 'id-1',
    mimeType: 'application/pdf',
    isFile: true,
    isShared: false,
    isSharedPublicly: false,
    hasThumbnail: false,
    size: 1234,
    metaDataModifyTime: 0,
    fileModifyTime: new Date('2026-03-05T13:30:00Z'),
    trashed: null,
    parentUid: undefined,
    hasSignatureIssues: false,
    type: NodeType.File,
    effectiveRole: MemberRole.Admin,
};

describe('getFolderItemAriaLabel', () => {
    it('falls back to "Item #<position>" when item is undefined (1-based, with selection)', () => {
        expect(getFolderItemAriaLabel({ item: undefined, isSelected: true, index: 2 })).toBe('Selected, Item #3');
        expect(getFolderItemAriaLabel({ item: undefined, isSelected: false, index: 0 })).toBe('Not selected, Item #1');
    });

    it('starts with "Selected" when isSelected is true', () => {
        expect(getFolderItemAriaLabel({ item: baseItem, isSelected: true, index: 0 }).startsWith('Selected, ')).toBe(
            true
        );
    });

    it('starts with "Not selected" when isSelected is false', () => {
        expect(
            getFolderItemAriaLabel({ item: baseItem, isSelected: false, index: 0 }).startsWith('Not selected, ')
        ).toBe(true);
    });

    it('includes the item name as the second part', () => {
        const parts = getFolderItemAriaLabel({ item: baseItem, isSelected: false, index: 0 }).split(', ');
        expect(parts[1]).toBe('Document.pdf');
    });

    it('labels files as "File"', () => {
        const parts = getFolderItemAriaLabel({ item: baseItem, isSelected: false, index: 0 }).split(', ');
        expect(parts[2]).toBe('File');
    });

    it('labels folders as "Folder"', () => {
        const folder: FolderViewItem = { ...baseItem, isFile: false, type: NodeType.Folder };
        const parts = getFolderItemAriaLabel({ item: folder, isSelected: false, index: 0 }).split(', ');
        expect(parts[2]).toBe('Folder');
    });

    it('prefixes the modified date with "Modified"', () => {
        const label = getFolderItemAriaLabel({ item: baseItem, isSelected: false, index: 0 });
        expect(label).toMatch(/Modified [A-Z]/);
    });

    it('omits size for folders', () => {
        const folder: FolderViewItem = { ...baseItem, isFile: false, type: NodeType.Folder };
        const label = getFolderItemAriaLabel({ item: folder, isSelected: false, index: 0 });
        expect(label).not.toMatch(/\d+\s*B/);
    });

    it('includes humanSize for files', () => {
        const label = getFolderItemAriaLabel({ item: baseItem, isSelected: false, index: 0 });
        // humanSize formats 1234 bytes as "1.21 KB" (or similar with a unit).
        expect(label).toMatch(/\d+(\.\d+)?\s*(B|KB|MB|GB)/);
    });

    it('appends "Shared" when item is shared', () => {
        const shared: FolderViewItem = { ...baseItem, isShared: true };
        const parts = getFolderItemAriaLabel({ item: shared, isSelected: false, index: 0 }).split(', ');
        expect(parts[parts.length - 1]).toBe('Shared');
    });

    it('does not append "Shared" when item is not shared', () => {
        expect(getFolderItemAriaLabel({ item: baseItem, isSelected: false, index: 0 })).not.toContain('Shared');
    });

    it('produces a CSV with the expected ordering', () => {
        // The date itself contains commas (e.g. "Mar 5, 2026, 2:30 PM"), so we
        // assert on the overall shape rather than splitting on `, `.
        const shared: FolderViewItem = { ...baseItem, isShared: true };
        const label = getFolderItemAriaLabel({ item: shared, isSelected: true, index: 0 });
        expect(label).toMatch(/^Selected, Document\.pdf, File, Modified .+, .+, Shared$/);
    });
});
