import { createRef } from 'react';

import { act, renderHook } from '@testing-library/react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import type { Element } from '../../models/element';
import { useItemContextMenu } from './useItemContextMenu';

jest.mock('@proton/unleash/useFlag', () => ({ useFlag: jest.fn() }));

jest.mock('../../hooks/mailbox/useElements', () => ({
    useGetElementsFromIDs: () => jest.fn(() => []),
}));

jest.mock('../../hooks/useBlockSender', () => ({
    __esModule: true,
    default: () => ({
        canShowBlockSender: false,
        handleClickBlockSender: jest.fn(),
        blockSenderModal: null,
    }),
}));

jest.mock('./ItemContextMenu', () => ({
    __esModule: true,
    default: () => null,
}));

const element = { ID: 'element-1' } as Element;

const createMouseEvent = () =>
    ({
        clientX: 10,
        clientY: 20,
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
    }) as unknown as React.MouseEvent<HTMLDivElement>;

const setup = (labelID: string, onCheck = jest.fn()) =>
    renderHook(
        ({ labelID }) =>
            useItemContextMenu({
                labelID,
                anchorRef: createRef<HTMLElement>(),
                checkedIDs: [],
                onCheck,
                onMarkAs: jest.fn(),
                onMove: jest.fn(),
                onDelete: jest.fn(),
                conversationMode: false,
            }),
        { initialProps: { labelID } }
    );

const isMenuOpen = (contextMenu: JSX.Element) => contextMenu.props.isOpen;

describe('useItemContextMenu', () => {
    beforeEach(() => {
        jest.mocked(useFlag).mockReturnValue(true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should open the context menu on right click outside of the soft deleted folder', () => {
        const onCheck = jest.fn();
        const { result } = setup(MAILBOX_LABEL_IDS.INBOX, onCheck);
        const event = createMouseEvent();

        act(() => {
            result.current.onContextMenu(event, element);
        });

        expect(event.preventDefault).toHaveBeenCalled();
        expect(onCheck).toHaveBeenCalledWith([element.ID], true, true);
        expect(isMenuOpen(result.current.contextMenu)).toBe(true);
    });

    it('should not open the context menu on right click in the soft deleted folder', () => {
        const onCheck = jest.fn();
        const { result } = setup(MAILBOX_LABEL_IDS.SOFT_DELETED, onCheck);
        const event = createMouseEvent();

        act(() => {
            result.current.onContextMenu(event, element);
        });

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(onCheck).not.toHaveBeenCalled();
        expect(isMenuOpen(result.current.contextMenu)).toBe(false);
    });

    it('should not show the context menu after leaving the soft deleted folder when right clicked there', () => {
        const { result, rerender } = setup(MAILBOX_LABEL_IDS.SOFT_DELETED);

        act(() => {
            result.current.onContextMenu(createMouseEvent(), element);
        });

        rerender({ labelID: MAILBOX_LABEL_IDS.INBOX });

        expect(isMenuOpen(result.current.contextMenu)).toBe(false);
    });

    it('should open the context menu in the soft deleted folder when retention policies are disabled', () => {
        jest.mocked(useFlag).mockReturnValue(false);
        const { result } = setup(MAILBOX_LABEL_IDS.SOFT_DELETED);

        act(() => {
            result.current.onContextMenu(createMouseEvent(), element);
        });

        expect(isMenuOpen(result.current.contextMenu)).toBe(true);
    });
});
