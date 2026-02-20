import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { SortField } from './types';
import { sortItems } from './utils';

type TestItem = {
    uid: string;
    name: string;
    type: 'folder' | 'file';
    size: number;
    createdAt: Date;
};

describe('sortItems', () => {
    const stringComparator = (a: string, b: string) => a.localeCompare(b);
    const numberComparator = (a: number, b: number) => a - b;
    const typeComparator = (a: string, b: string) => {
        if (a === 'folder' && b === 'file') {
            return -1;
        }
        if (a === 'file' && b === 'folder') {
            return 1;
        }
        return 0;
    };

    const getValueForField = (item: TestItem, field: SortField): unknown => {
        switch (field) {
            case SortField.name:
                return item.name;
            case SortField.nodeType:
                return item.type;
            case SortField.size:
                return item.size;
            case SortField.creationTime:
                return item.createdAt;
            default:
                return undefined;
        }
    };

    const getKey = (item: TestItem) => item.uid;

    describe('single-level sorting', () => {
        it('should sort items by name in ascending order', () => {
            const items: TestItem[] = [
                { uid: 'uid1', name: 'charlie', type: 'file', size: 100, createdAt: new Date('2024-01-01') },
                { uid: 'uid2', name: 'alice', type: 'file', size: 200, createdAt: new Date('2024-01-02') },
                { uid: 'uid3', name: 'bob', type: 'file', size: 300, createdAt: new Date('2024-01-03') },
            ];

            const result = sortItems(
                items,
                [{ field: SortField.name, comparator: stringComparator }],
                SORT_DIRECTION.ASC,
                getValueForField,
                getKey
            );

            expect(result).toEqual(['uid2', 'uid3', 'uid1']);
        });

        it('should sort items by name in descending order', () => {
            const items: TestItem[] = [
                { uid: 'uid1', name: 'charlie', type: 'file', size: 100, createdAt: new Date('2024-01-01') },
                { uid: 'uid2', name: 'alice', type: 'file', size: 200, createdAt: new Date('2024-01-02') },
                { uid: 'uid3', name: 'bob', type: 'file', size: 300, createdAt: new Date('2024-01-03') },
            ];

            const result = sortItems(
                items,
                [{ field: SortField.name, comparator: stringComparator }],
                SORT_DIRECTION.DESC,
                getValueForField,
                getKey
            );

            expect(result).toEqual(['uid1', 'uid3', 'uid2']);
        });

        it('should sort items by size', () => {
            const items: TestItem[] = [
                { uid: 'uid1', name: 'file1', type: 'file', size: 300, createdAt: new Date('2024-01-01') },
                { uid: 'uid2', name: 'file2', type: 'file', size: 100, createdAt: new Date('2024-01-02') },
                { uid: 'uid3', name: 'file3', type: 'file', size: 200, createdAt: new Date('2024-01-03') },
            ];

            const result = sortItems(
                items,
                [{ field: SortField.size, comparator: numberComparator }],
                SORT_DIRECTION.ASC,
                getValueForField,
                getKey
            );

            expect(result).toEqual(['uid2', 'uid3', 'uid1']);
        });
    });

    describe('multi-level sorting', () => {
        it('should sort by type (folders first), then by name', () => {
            const items: TestItem[] = [
                { uid: 'uid1', name: 'file-b', type: 'file', size: 100, createdAt: new Date('2024-01-01') },
                { uid: 'uid2', name: 'folder-b', type: 'folder', size: 0, createdAt: new Date('2024-01-02') },
                { uid: 'uid3', name: 'file-a', type: 'file', size: 200, createdAt: new Date('2024-01-03') },
                { uid: 'uid4', name: 'folder-a', type: 'folder', size: 0, createdAt: new Date('2024-01-04') },
            ];

            const result = sortItems(
                items,
                [
                    { field: SortField.nodeType, comparator: typeComparator },
                    { field: SortField.name, comparator: stringComparator },
                ],
                SORT_DIRECTION.ASC,
                getValueForField,
                getKey
            );

            expect(result).toEqual(['uid4', 'uid2', 'uid3', 'uid1']);
        });

        it('should sort by type and name, both descending', () => {
            const items: TestItem[] = [
                { uid: 'uid1', name: 'file-b', type: 'file', size: 100, createdAt: new Date('2024-01-01') },
                { uid: 'uid2', name: 'folder-b', type: 'folder', size: 0, createdAt: new Date('2024-01-02') },
                { uid: 'uid3', name: 'file-a', type: 'file', size: 200, createdAt: new Date('2024-01-03') },
                { uid: 'uid4', name: 'folder-a', type: 'folder', size: 0, createdAt: new Date('2024-01-04') },
            ];

            const result = sortItems(
                items,
                [
                    { field: SortField.nodeType, comparator: typeComparator },
                    { field: SortField.name, comparator: stringComparator },
                ],
                SORT_DIRECTION.DESC,
                getValueForField,
                getKey
            );

            expect(result).toEqual(['uid1', 'uid3', 'uid2', 'uid4']);
        });
    });

    describe('per-level direction', () => {
        it('should respect explicit direction on first level', () => {
            const items: TestItem[] = [
                { uid: 'uid1', name: 'file-b', type: 'file', size: 100, createdAt: new Date('2024-01-01') },
                { uid: 'uid2', name: 'folder-b', type: 'folder', size: 0, createdAt: new Date('2024-01-02') },
                { uid: 'uid3', name: 'file-a', type: 'file', size: 200, createdAt: new Date('2024-01-03') },
                { uid: 'uid4', name: 'folder-a', type: 'folder', size: 0, createdAt: new Date('2024-01-04') },
            ];

            const result = sortItems(
                items,
                [
                    { field: SortField.nodeType, comparator: typeComparator, direction: SORT_DIRECTION.ASC },
                    { field: SortField.name, comparator: stringComparator },
                ],
                SORT_DIRECTION.DESC,
                getValueForField,
                getKey
            );

            expect(result).toEqual(['uid2', 'uid4', 'uid1', 'uid3']);
        });

        it('should use global direction when level direction is not specified', () => {
            const items: TestItem[] = [
                { uid: 'uid1', name: 'file-b', type: 'file', size: 100, createdAt: new Date('2024-01-01') },
                { uid: 'uid2', name: 'folder-b', type: 'folder', size: 0, createdAt: new Date('2024-01-02') },
                { uid: 'uid3', name: 'file-a', type: 'file', size: 200, createdAt: new Date('2024-01-03') },
                { uid: 'uid4', name: 'folder-a', type: 'folder', size: 0, createdAt: new Date('2024-01-04') },
            ];

            const result = sortItems(
                items,
                [
                    { field: SortField.nodeType, comparator: typeComparator, direction: SORT_DIRECTION.ASC },
                    { field: SortField.name, comparator: stringComparator },
                ],
                SORT_DIRECTION.ASC,
                getValueForField,
                getKey
            );

            expect(result).toEqual(['uid4', 'uid2', 'uid3', 'uid1']);
        });

        it('should allow each level to have its own direction', () => {
            const items: TestItem[] = [
                { uid: 'uid1', name: 'file-b', type: 'file', size: 300, createdAt: new Date('2024-01-01') },
                { uid: 'uid2', name: 'file-a', type: 'file', size: 100, createdAt: new Date('2024-01-02') },
                { uid: 'uid3', name: 'file-c', type: 'file', size: 200, createdAt: new Date('2024-01-03') },
            ];

            const result = sortItems(
                items,
                [
                    { field: SortField.size, comparator: numberComparator, direction: SORT_DIRECTION.ASC },
                    { field: SortField.name, comparator: stringComparator, direction: SORT_DIRECTION.DESC },
                ],
                SORT_DIRECTION.DESC,
                getValueForField,
                getKey
            );

            expect(result).toEqual(['uid2', 'uid3', 'uid1']);
        });
    });

    describe('edge cases', () => {
        it('should handle empty items array', () => {
            const items: TestItem[] = [];

            const result = sortItems(
                items,
                [{ field: SortField.name, comparator: stringComparator }],
                SORT_DIRECTION.ASC,
                getValueForField,
                getKey
            );

            expect(result).toEqual([]);
        });

        it('should handle empty sortConfig array', () => {
            const items: TestItem[] = [
                { uid: 'uid1', name: 'charlie', type: 'file', size: 100, createdAt: new Date('2024-01-01') },
                { uid: 'uid2', name: 'alice', type: 'file', size: 200, createdAt: new Date('2024-01-02') },
            ];

            const result = sortItems(items, [], SORT_DIRECTION.ASC, getValueForField, getKey);

            expect(result).toEqual(['uid1', 'uid2']);
        });

        it('should fall through to next level when comparator returns NaN', () => {
            const nanComparator = (a: number, b: number) => a - b;
            const items = [
                { uid: 'uid1', name: 'b', type: 'file' as const, size: NaN, createdAt: new Date('2024-01-01') },
                { uid: 'uid2', name: 'a', type: 'file' as const, size: NaN, createdAt: new Date('2024-01-02') },
            ];

            const result = sortItems(
                items,
                [
                    { field: SortField.size, comparator: nanComparator },
                    { field: SortField.name, comparator: stringComparator },
                ],
                SORT_DIRECTION.ASC,
                getValueForField,
                getKey
            );

            expect(result).toEqual(['uid2', 'uid1']);
        });

        it('should handle items with equal values', () => {
            const items: TestItem[] = [
                { uid: 'uid1', name: 'same', type: 'file', size: 100, createdAt: new Date('2024-01-01') },
                { uid: 'uid2', name: 'same', type: 'file', size: 100, createdAt: new Date('2024-01-02') },
                { uid: 'uid3', name: 'same', type: 'file', size: 100, createdAt: new Date('2024-01-03') },
            ];

            const result = sortItems(
                items,
                [{ field: SortField.name, comparator: stringComparator }],
                SORT_DIRECTION.ASC,
                getValueForField,
                getKey
            );

            expect(result).toEqual(['uid1', 'uid2', 'uid3']);
        });
    });
});
