import { act, renderHook } from '@testing-library/react-hooks';

import type { Filter, Sort } from 'proton-mail/models/tools';

import { useMailboxFocus } from './useMailboxFocus';
import type { MailboxFocusProps } from './useMailboxFocus';

// Mock filter and sort types for the test
const mockFilter = {} as Filter;
const mockSort = {} as Sort;

describe('useMailboxFocus', () => {
    const defaultProps = {
        elementIDs: ['id1', 'id2', 'id3'],
        page: 1,
        filter: mockFilter,
        sort: mockSort,
        showList: true,
        listRef: { current: document.createElement('div') },
        labelID: 'label1',
        isComposerOpened: false,
        loading: false,
    };
    const setup = (overrides: Partial<MailboxFocusProps> = {}) => {
        const props: MailboxFocusProps = {
            ...defaultProps,
            ...overrides,
        };
        return renderHook((newProps) => useMailboxFocus(newProps), { initialProps: props });
    };

    it('should initialize focusID as undefined', () => {
        const { result } = setup();
        expect(result.current.focusID).toBeUndefined();
    });

    it('should focus the last ID when calling focusLastID', () => {
        const { result } = setup();

        act(() => {
            result.current.focusLastID();
        });

        expect(result.current.focusID).toBe('id3');
    });

    it('should focus the first ID when calling focusFirstID', () => {
        const { result } = setup();

        act(() => {
            result.current.focusFirstID();
        });

        expect(result.current.focusID).toBe('id1');
    });

    it('should focus the next ID when calling focusNextID', () => {
        const { result } = setup();

        act(() => {
            result.current.setFocusID('id1');
        });

        act(() => {
            result.current.focusNextID();
        });

        expect(result.current.focusID).toBe('id2');
    });

    it('should reset focus when elementIDs is empty', async () => {
        const { result, rerender } = setup();

        act(() => {
            result.current.setFocusID('id2');
        });

        rerender({
            ...defaultProps,
            elementIDs: [],
        });

        expect(result.current.focusID).toBeUndefined();
    });

    it('should focus the previous ID when calling focusPreviousID', () => {
        const { result } = setup();
        act(() => {
            result.current.setFocusID('id2');
        });

        act(() => {
            result.current.focusPreviousID();
        });

        expect(result.current.focusID).toBe('id1');
    });

    it('should not change focus when composer is opened', () => {
        const { result, rerender } = setup();

        act(() => {
            result.current.focusFirstID();
        });

        rerender({
            ...defaultProps,
            isComposerOpened: true,
        });

        expect(result.current.focusID).toBeUndefined();
    });

    it('should not focus if loading is true', () => {
        const { result, rerender } = setup();

        act(() => {
            result.current.focusFirstID();
        });

        rerender({
            ...defaultProps,
            loading: true,
        });

        expect(result.current.focusID).toBe('id1');
    });

    it('should not focus if list is hidden', () => {
        const { result, rerender } = setup();
        act(() => {
            result.current.focusFirstID();
        });

        rerender({
            ...defaultProps,
            showList: false,
        });

        expect(result.current.focusID).toBeUndefined();
    });

    it('should reset focus when label changes', () => {
        const { result, rerender } = setup({
            filter: mockFilter,
            sort: mockSort,
            labelID: 'label1',
        });

        act(() => {
            result.current.focusFirstID();
        });

        rerender({
            ...defaultProps,
            labelID: 'label2', // Change labelID
        });

        expect(result.current.focusID).toBeUndefined();
    });

    it('should reset focus when filter changes', () => {
        const { result, rerender } = setup({
            filter: mockFilter,
            sort: mockSort,
            labelID: 'label1',
        });

        act(() => {
            result.current.focusFirstID();
        });

        rerender({
            ...defaultProps,
            filter: {} as Filter, // Change filter
        });

        expect(result.current.focusID).toBeUndefined();
    });

    it('should reset focus when sort changes', () => {
        const { result, rerender } = setup({
            filter: mockFilter,
            sort: mockSort,
            labelID: 'label1',
        });

        act(() => {
            result.current.focusFirstID();
        });

        rerender({
            ...defaultProps,
            sort: {
                sort: 'Size',
                desc: true,
            } as Sort, // Change sort
        });

        expect(result.current.focusID).toBeUndefined();
    });

    it('should preserve focus when elementIDs change', () => {
        const { result, rerender } = setup();
        act(() => {
            result.current.focusFirstID();
        });

        rerender({
            ...defaultProps,
            elementIDs: ['id4', 'id1', 'id5', 'id6'],
        });

        expect(result.current.focusID).toBe('id1');
    });

    it('should try to focus same index when elementIDs change and focusID is not in the new list', () => {
        const { result, rerender } = setup();
        act(() => {
            result.current.focusFirstID(); // Focus id1
        });

        rerender({
            ...defaultProps,
            elementIDs: ['id4', 'id5', 'id6'],
        });

        expect(result.current.focusID).toBe('id4');
    });
});
