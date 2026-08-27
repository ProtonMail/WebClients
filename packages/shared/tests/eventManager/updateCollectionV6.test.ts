import { type UpdateCollectionV6, updateCollectionV6 } from '../../lib/eventManager/updateCollectionV6';

// Test interface for our collection items
interface TestItem {
    ID: string;
    name: string;
    value?: number;
}

describe('updateCollectionV6', () => {
    // Initial collection for most tests
    const initialCollection: TestItem[] = [
        { ID: '1', name: 'Item 1', value: 10 },
        { ID: '2', name: 'Item 2', value: 20 },
        { ID: '3', name: 'Item 3', value: 30 },
    ];

    it('should return a new array instance', () => {
        const updates: UpdateCollectionV6<TestItem> = { delete: [], upsert: [] };
        const result = updateCollectionV6(initialCollection, updates);

        expect(result).toEqual(initialCollection);
        expect(result).not.toBe(initialCollection); // Should be a new array instance
    });

    describe('deleting items', () => {
        it('should delete items by ID', () => {
            const updates: UpdateCollectionV6<TestItem> = {
                delete: ['1', '3'],
                upsert: [],
            };

            const result = updateCollectionV6(initialCollection, updates);

            expect(result).toEqual([{ ID: '2', name: 'Item 2', value: 20 }]);
        });

        it('should handle deletion of non-existent IDs', () => {
            const updates: UpdateCollectionV6<TestItem> = {
                delete: ['4', '5'],
                upsert: [],
            };

            const result = updateCollectionV6(initialCollection, updates);

            expect(result).toEqual(initialCollection);
        });

        it('should handle empty delete array', () => {
            const updates: UpdateCollectionV6<TestItem> = {
                delete: [],
                upsert: [],
            };

            const result = updateCollectionV6(initialCollection, updates);

            expect(result).toEqual(initialCollection);
        });
    });

    describe('upserting items', () => {
        it('should update existing items', () => {
            const updates: UpdateCollectionV6<TestItem> = {
                delete: [],
                upsert: [
                    { ID: '1', name: 'Updated Item 1', value: 100 },
                    { ID: '3', name: 'Updated Item 3' },
                ],
            };

            const result = updateCollectionV6(initialCollection, updates);

            expect(result).toEqual([
                { ID: '1', name: 'Updated Item 1', value: 100 },
                { ID: '2', name: 'Item 2', value: 20 },
                { ID: '3', name: 'Updated Item 3' },
            ]);
        });

        it('should insert new items', () => {
            const updates: UpdateCollectionV6<TestItem> = {
                delete: [],
                upsert: [
                    { ID: '4', name: 'New Item 4', value: 40 },
                    { ID: '5', name: 'New Item 5', value: 50 },
                ],
            };

            const result = updateCollectionV6(initialCollection, updates);

            expect(result).toEqual([
                ...initialCollection,
                { ID: '4', name: 'New Item 4', value: 40 },
                { ID: '5', name: 'New Item 5', value: 50 },
            ]);
        });

        it('should handle empty upsert array', () => {
            const updates: UpdateCollectionV6<TestItem> = {
                delete: [],
                upsert: [],
            };

            const result = updateCollectionV6(initialCollection, updates);

            expect(result).toEqual(initialCollection);
        });

        it('should ignore items without an ID', () => {
            const updates: UpdateCollectionV6<TestItem> = {
                delete: [],
                upsert: [
                    { ID: '', name: 'Empty ID Item' },
                    { ID: '4', name: 'Valid ID Item' },
                ],
            };

            const result = updateCollectionV6(initialCollection, updates);

            expect(result).toEqual([...initialCollection, { ID: '4', name: 'Valid ID Item' }]);
        });
    });

    describe('combined operations', () => {
        it('should handle deletion and upsertion together', () => {
            const updates: UpdateCollectionV6<TestItem> = {
                delete: ['2'],
                upsert: [
                    { ID: '1', name: 'Updated Item 1' },
                    { ID: '4', name: 'New Item 4' },
                ],
            };

            const result = updateCollectionV6(initialCollection, updates);

            expect(result).toEqual([
                { ID: '1', name: 'Updated Item 1' },
                { ID: '3', name: 'Item 3', value: 30 },
                { ID: '4', name: 'New Item 4' },
            ]);
        });

        it('should handle upsert and delete of the same ID (delete takes precedence)', () => {
            const updates: UpdateCollectionV6<TestItem> = {
                delete: ['1', '4'],
                upsert: [
                    { ID: '1', name: 'Should be deleted' },
                    { ID: '4', name: 'Should be deleted too' },
                ],
            };

            const result = updateCollectionV6(initialCollection, updates);

            expect(result).toEqual([
                { ID: '2', name: 'Item 2', value: 20 },
                { ID: '3', name: 'Item 3', value: 30 },
            ]);
        });
    });

    describe('custom create and merge functions', () => {
        interface ExtendedItem {
            ID: string;
            name: string;
            timestamp?: number;
        }

        const createFn = (item: ExtendedItem): TestItem => ({
            ID: item.ID,
            name: `Created: ${item.name}`,
            value: 0,
        });

        const mergeFn = (prev: TestItem, update: ExtendedItem): TestItem => ({
            ID: prev.ID,
            name: `${prev.name} + ${update.name}`,
            value: prev.value,
        });

        it('should use custom create function', () => {
            const updates: UpdateCollectionV6<ExtendedItem> = {
                delete: [],
                upsert: [{ ID: '4', name: 'New Item' }],
            };

            const result = updateCollectionV6(initialCollection, updates, { create: createFn });

            expect(result).toEqual([...initialCollection, { ID: '4', name: 'Created: New Item', value: 0 }]);
        });

        it('should use custom merge function', () => {
            const updates: UpdateCollectionV6<ExtendedItem> = {
                delete: [],
                upsert: [{ ID: '1', name: 'Updated' }],
            };

            const result = updateCollectionV6(initialCollection, updates, { merge: mergeFn });

            expect(result).toEqual([
                { ID: '1', name: 'Item 1 + Updated', value: 10 },
                { ID: '2', name: 'Item 2', value: 20 },
                { ID: '3', name: 'Item 3', value: 30 },
            ]);
        });

        it('should use both custom create and merge functions', () => {
            const updates: UpdateCollectionV6<ExtendedItem> = {
                delete: [],
                upsert: [
                    { ID: '1', name: 'Updated' },
                    { ID: '4', name: 'New Item' },
                ],
            };

            const result = updateCollectionV6(initialCollection, updates, {
                create: createFn,
                merge: mergeFn,
            });

            expect(result).toEqual([
                { ID: '1', name: 'Item 1 + Updated', value: 10 },
                { ID: '2', name: 'Item 2', value: 20 },
                { ID: '3', name: 'Item 3', value: 30 },
                { ID: '4', name: 'Created: New Item', value: 0 },
            ]);
        });
    });

    describe('edge cases', () => {
        it('should handle empty initial collection', () => {
            const emptyCollection: TestItem[] = [];
            const updates: UpdateCollectionV6<TestItem> = {
                delete: ['1'],
                upsert: [{ ID: '2', name: 'New Item' }],
            };

            const result = updateCollectionV6(emptyCollection, updates);

            expect(result).toEqual([{ ID: '2', name: 'New Item' }]);
        });

        it('should handle different types with the same structure', () => {
            interface OtherItem {
                ID: string;
                label: string;
            }

            const updates: UpdateCollectionV6<OtherItem> = {
                delete: [],
                upsert: [{ ID: '4', label: 'Different structure' }],
            };

            const createFn = (item: OtherItem): TestItem => ({
                ID: item.ID,
                name: item.label,
            });

            const result = updateCollectionV6(initialCollection, updates, { create: createFn });

            expect(result).toEqual([...initialCollection, { ID: '4', name: 'Different structure' }]);
        });
    });

    describe('other ids', () => {
        it('should allow specify other id keys', () => {
            interface TestItemID {
                OtherID: string;
                name: string;
                value?: number;
            }

            const collection: TestItemID[] = [
                { OtherID: '1', name: 'Item 1' },
                { OtherID: '2', name: 'Item 2' },
            ];
            const updates: UpdateCollectionV6<TestItemID> = {
                delete: ['1'],
                upsert: [
                    { OtherID: '2', name: 'Updated Item' },
                    { OtherID: '3', name: 'New Item' },
                ],
            };

            const result = updateCollectionV6(collection, updates, { idKey: 'OtherID' });

            expect(result).toEqual([
                { OtherID: '2', name: 'Updated Item' },
                { OtherID: '3', name: 'New Item' },
            ]);
        });
    });
});
