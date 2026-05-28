import { act, renderHook } from '@testing-library/react-hooks';

import type { Filter, Sort } from '@proton/shared/lib/mail/search';

import { useMailboxFocus } from './useMailboxFocus';
import type { MailboxFocusProps } from './useMailboxFocus';

const mockStoreState = {
    elementIDs: ['id1', 'id2', 'id3'] as string[],
    page: 1,
    filter: {} as Filter,
    sort: {} as Sort,
    labelID: 'label1',
};

jest.mock('proton-mail/store/hooks', () => ({
    useMailSelector: jest.fn((selector: (state: any) => any) => selector(mockStoreState)),
}));

jest.mock('proton-mail/store/elements/elementsSelectors', () => ({
    selectElementIDs: (state: any) => state.elementIDs,
    selectPage: (state: any) => state.page,
    selectFilter: (state: any) => state.filter,
    selectSort: (state: any) => state.sort,
    selectLabelID: (state: any) => state.labelID,
}));

describe('useMailboxFocus', () => {
    const defaultProps: MailboxFocusProps = {
        showList: true,
        listRef: { current: document.createElement('div') },
        isComposerOpened: false,
        loading: false,
    };

    beforeEach(() => {
        mockStoreState.elementIDs = ['id1', 'id2', 'id3'];
        mockStoreState.page = 1;
        mockStoreState.filter = {} as Filter;
        mockStoreState.sort = {} as Sort;
        mockStoreState.labelID = 'label1';
    });

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

    it('should reset focus when elementIDs is empty', () => {
        const { result, rerender } = setup();

        act(() => {
            result.current.setFocusID('id2');
        });

        mockStoreState.elementIDs = [];
        rerender(defaultProps);

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

    it('should reset focus when composer is opened', () => {
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

    it('should not reset focus if loading is true', () => {
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

    it('should reset focus if list is hidden', () => {
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
        const { result, rerender } = setup();

        act(() => {
            result.current.focusFirstID();
        });

        mockStoreState.labelID = 'label2';
        rerender(defaultProps);

        expect(result.current.focusID).toBeUndefined();
    });

    it('should reset focus when filter changes', () => {
        const { result, rerender } = setup();

        act(() => {
            result.current.focusFirstID();
        });

        mockStoreState.filter = { a: 1 } as Filter;
        rerender(defaultProps);

        expect(result.current.focusID).toBeUndefined();
    });

    it('should reset focus when sort changes', () => {
        const { result, rerender } = setup();

        act(() => {
            result.current.focusFirstID();
        });

        mockStoreState.sort = { sort: 'Size', desc: true } as Sort;
        rerender(defaultProps);

        expect(result.current.focusID).toBeUndefined();
    });

    it('should preserve focus when elementIDs change but focusID is still present', () => {
        const { result, rerender } = setup();
        act(() => {
            result.current.focusFirstID();
        });

        mockStoreState.elementIDs = ['id4', 'id1', 'id5', 'id6'];
        rerender(defaultProps);

        expect(result.current.focusID).toBe('id1');
    });

    it('should try to focus same index when elementIDs change and focusID is not in the new list', () => {
        const { result, rerender } = setup();
        act(() => {
            result.current.focusFirstID(); // Focus id1 (index 0)
        });

        mockStoreState.elementIDs = ['id4', 'id5', 'id6'];
        rerender(defaultProps);

        expect(result.current.focusID).toBe('id4');
    });
});
