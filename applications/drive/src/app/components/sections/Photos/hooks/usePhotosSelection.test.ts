import { act, renderHook } from '@testing-library/react-hooks';

import { isPhotoGroup } from '../../../../store/_photos';
import type { PhotoGroup } from '../../../../store/_photos/interface';
import { getGroupLinkIds, usePhotosSelection } from './usePhotosSelection';

const groups: Record<PhotoGroup, string[]> = {
    group1: ['id1', 'id2', 'id3'],
    group2: ['id4', 'id5'],
    empty: [],
    group3: ['id6'],
};

const makeItem = (linkId: string) => ({ linkId });

const data = Object.keys(groups).reduce<(string | ReturnType<typeof makeItem>)[]>((acc, item) => {
    acc.push(item);
    acc.push(...groups[item].map(makeItem));

    return acc;
}, []);

const indexMap = data.reduce<Record<string, number>>((acc, item, index) => {
    if (!isPhotoGroup(item)) {
        acc[item.linkId] = index;
    }

    return acc;
}, {});

describe('usePhotosSelection', () => {
    let hook: {
        current: ReturnType<typeof usePhotosSelection>;
    };

    beforeEach(() => {
        jest.resetAllMocks();

        const { result } = renderHook(() => usePhotosSelection(data, indexMap));
        hook = result;

        expect(hook.current.selectedItems).toStrictEqual([]);
    });

    it('selects IDs', () => {
        const input = ['id1', 'id2'];
        const expected = input.map(makeItem);

        act(() => {
            hook.current.setSelected(true, ...input);
        });

        expect(hook.current.selectedItems).toStrictEqual(expected);
    });

    it('removes the IDs from the map', () => {
        const input = ['id1', 'id2'];
        const params = ['id1'];
        const expected = ['id2'].map(makeItem);

        act(() => {
            hook.current.setSelected(true, ...input);
            hook.current.setSelected(false, ...params);
        });

        expect(hook.current.selectedItems).toStrictEqual(expected);
    });

    it("does not fail when removing IDs that aren't in the state", () => {
        const input = ['id1', 'id2'];
        const params = ['not-in-state', 'blah'];
        const expected = input.map(makeItem);

        act(() => {
            hook.current.setSelected(true, ...input);
            hook.current.setSelected(false, ...params);
        });

        expect(hook.current.selectedItems).toStrictEqual(expected);
    });

    it("does not show IDs that aren't in the data", () => {
        const input = ['id9001'];
        const expected: any[] = [];

        act(() => {
            hook.current.setSelected(true, ...input);
        });

        expect(hook.current.selectedItems).toStrictEqual(expected);
    });

    it('clears selection', () => {
        const input = ['id1', 'id2'];
        const expected: any[] = [];

        act(() => {
            hook.current.setSelected(true, ...input);
            hook.current.clearSelection();
        });

        expect(hook.current.selectedItems).toStrictEqual(expected);
    });

    describe('handleSelection', () => {
        it('selects groups properly', () => {
            const id = 'group1';

            act(() => {
                hook.current.handleSelection(
                    data.findIndex((group) => group === id),
                    { isSelected: true }
                );
            });

            expect(hook.current.selectedItems).toStrictEqual(groups[id].map(makeItem));
        });

        it('selects items properly', () => {
            const id = 'id2';
            const index = indexMap[id];

            act(() => {
                hook.current.handleSelection(index, { isSelected: true });
            });

            expect(hook.current.selectedItems).toStrictEqual([data[index]]);
        });
    });

    describe('isGroupSelected', () => {
        it('returns true for a fully selected group', () => {
            const id = 'group1';
            const group = groups[id];

            act(() => {
                hook.current.setSelected(true, ...group);
            });

            expect(hook.current.isGroupSelected(data.findIndex((item) => item === id))).toBe(true);
        });

        it("returns 'some' for a partially selected group (start not selected)", () => {
            const id = 'group1';
            const group = groups[id];

            act(() => {
                hook.current.setSelected(true, ...group.slice(1, 2));
            });

            expect(hook.current.isGroupSelected(data.findIndex((item) => item === id))).toBe('some');
        });

        it("returns 'some' for a partially selected group (middle not selected)", () => {
            const id = 'group1';
            const group = groups[id];

            act(() => {
                hook.current.setSelected(true, group[0], group[2]);
            });

            expect(hook.current.isGroupSelected(data.findIndex((item) => item === id))).toBe('some');
        });

        it("returns 'some' for a partially selected group (end not selected)", () => {
            const id = 'group1';
            const group = groups[id];

            act(() => {
                hook.current.setSelected(true, ...group.slice(0, 2));
            });

            expect(hook.current.isGroupSelected(data.findIndex((item) => item === id))).toBe('some');
        });

        it("returns 'some' if only the first item is selected", () => {
            const id = 'group1';
            const group = groups[id];

            act(() => {
                hook.current.setSelected(true, group[0]);
            });

            expect(hook.current.isGroupSelected(data.findIndex((item) => item === id))).toBe('some');
        });

        it("returns 'some' if only the last item is selected", () => {
            const id = 'group1';
            const group = groups[id];

            act(() => {
                hook.current.setSelected(true, group[group.length - 1]);
            });

            expect(hook.current.isGroupSelected(data.findIndex((item) => item === id))).toBe('some');
        });

        it('returns false for a non-selected group', () => {
            const id = 'group1';
            const group = groups[id];
            const otherId = 'group2';

            act(() => {
                hook.current.setSelected(true, ...group);
            });

            expect(hook.current.isGroupSelected(data.findIndex((item) => item === otherId))).toBe(false);
        });

        it('returns false for an empty group', () => {
            const id = 'empty';

            expect(hook.current.isGroupSelected(data.findIndex((item) => item === id))).toBe(false);
        });
    });

    describe('isItemSelected', () => {
        it('returns true for a selected item', () => {
            const id = 'id1';

            act(() => {
                hook.current.setSelected(true, id);
            });

            expect(hook.current.isItemSelected(id)).toBe(true);
        });

        it('returns false for a non-selected item', () => {
            const id = 'id1';
            const otherId = 'id2';

            act(() => {
                hook.current.setSelected(true, id);
            });

            expect(hook.current.isItemSelected(otherId)).toBe(false);
        });
    });
    describe('isMultiSelect', () => {
        it('select multiple items', () => {
            const id = 'id1';
            const lastId = 'id6';

            act(() => {
                hook.current.handleSelection(
                    data.findIndex((link) => typeof link !== 'string' && link.linkId === id),
                    { isSelected: true, isMultiSelect: true }
                );
            });
            expect(hook.current.isItemSelected(id)).toBe(true);

            act(() => {
                hook.current.handleSelection(
                    data.findIndex((link) => typeof link !== 'string' && link.linkId === lastId),
                    { isSelected: true, isMultiSelect: true }
                );
            });
            expect(hook.current.selectedItems).toStrictEqual(data.filter((item) => typeof item !== 'string'));
        });

        it('select multiple items after selecting a group', () => {
            const id = 'group1';
            const lastId = 'id6';

            act(() => {
                hook.current.handleSelection(
                    data.findIndex((group) => group === id),
                    { isSelected: true, isMultiSelect: true }
                );
            });

            act(() => {
                hook.current.handleSelection(
                    data.findIndex((link) => typeof link !== 'string' && link.linkId === lastId),
                    { isSelected: true, isMultiSelect: true }
                );
            });
            expect(hook.current.selectedItems).toStrictEqual(data.filter((item) => typeof item !== 'string'));
        });

        it('select multiple from higher index to lower', () => {
            const id = 'id6';
            const lastId = 'id1';

            act(() => {
                hook.current.handleSelection(
                    data.findIndex((link) => typeof link !== 'string' && link.linkId === id),
                    { isSelected: true, isMultiSelect: true }
                );
            });
            expect(hook.current.isItemSelected(id)).toBe(true);

            act(() => {
                hook.current.handleSelection(
                    data.findIndex((link) => typeof link !== 'string' && link.linkId === lastId),
                    { isSelected: true, isMultiSelect: true }
                );
            });
            expect(hook.current.selectedItems).toStrictEqual(data.filter((item) => typeof item !== 'string'));
        });

        it('unselect multiple items ', () => {
            const id = 'id1';
            const id2 = 'id2';
            const lastId = 'id6';

            act(() => {
                hook.current.handleSelection(
                    data.findIndex((link) => typeof link !== 'string' && link.linkId === id),
                    { isSelected: true, isMultiSelect: true }
                );
            });
            act(() => {
                hook.current.handleSelection(
                    data.findIndex((link) => typeof link !== 'string' && link.linkId === lastId),
                    { isSelected: true, isMultiSelect: true }
                );
            });

            expect(hook.current.selectedItems).toStrictEqual(data.filter((item) => typeof item !== 'string'));

            act(() => {
                hook.current.handleSelection(
                    data.findIndex((link) => typeof link !== 'string' && link.linkId === id2),
                    { isSelected: true, isMultiSelect: true }
                );
            });
            expect(hook.current.isGroupSelected(data.findIndex((item) => item === id || item === id2))).toBe(false);
        });
    });
});

describe('getGroupLinkIds', () => {
    it('gets all group items', () => {
        const id = 'group1';

        act(() => {
            const groupItems = getGroupLinkIds(
                data,
                data.findIndex((item) => item === id)
            );
            expect(groupItems).toStrictEqual(groups[id]);
        });
    });

    it('handles empty groups', () => {
        const id = 'empty';

        act(() => {
            const groupItems = getGroupLinkIds(
                data,
                data.findIndex((item) => item === id)
            );
            expect(groupItems).toStrictEqual([]);
        });
    });

    it('handles the last group properly', () => {
        const id = 'group3';

        act(() => {
            const groupItems = getGroupLinkIds(
                data,
                data.findIndex((item) => item === id)
            );
            expect(groupItems).toStrictEqual(groups[id]);
        });
    });

    it('does not error on out-of-bounds groups', () => {
        act(() => {
            const groupItems = getGroupLinkIds(data, 9000);
            expect(groupItems).toStrictEqual([]);
        });
    });

    it('does not error on non-groups', () => {
        const id = 'id1';

        act(() => {
            const groupItems = getGroupLinkIds(data, indexMap[id]);
            expect(groupItems).toStrictEqual([]);
        });
    });
});
