import { render, screen } from '@testing-library/react';

import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { useMailSelector } from 'proton-mail/store/hooks';

import { elementsAreUnread as elementsAreUnreadSelector, params } from '../../../store/elements/elementsSelectors';
import ReadUnreadButtons from './ReadUnreadButtons';

jest.mock('@proton/mail/store/mailSettings/hooks');
jest.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);

jest.mock('proton-mail/store/hooks');
const mockUseMailSelector = jest.mocked(useMailSelector);

jest.mock('proton-mail/hooks/useSelectAll', () => ({
    useSelectAll: jest.fn(() => ({ selectAll: false })),
}));
const mockUseSelectAll = jest.requireMock('proton-mail/hooks/useSelectAll').useSelectAll;

const getProps = (selectedIDs: string[] = ['id1', 'id2']) => ({
    selectedIDs,
    onMarkAs: jest.fn(),
});

const mockSelectors = (elementsAreUnread: Record<string, boolean>) => {
    mockUseMailSelector.mockImplementation((selector: any) => {
        if (selector === params) {
            return { labelID: MAILBOX_LABEL_IDS.INBOX };
        }
        if (selector === elementsAreUnreadSelector) {
            return elementsAreUnread;
        }
    });
};

describe('ReadUnreadButtons', () => {
    afterEach(() => {
        jest.clearAllMocks();
        mockUseSelectAll.mockReturnValue({ selectAll: false });
    });

    it('should not show buttons when no items are selected', () => {
        mockSelectors({});
        render(<ReadUnreadButtons {...getProps([])} />);

        expect(screen.queryByTestId('toolbar:read')).toBeNull();
        expect(screen.queryByTestId('toolbar:unread')).toBeNull();
    });

    it('should show "Mark as read" button when all items are unread', () => {
        mockSelectors({ id1: true, id2: true });
        render(<ReadUnreadButtons {...getProps()} />);

        expect(screen.getByTestId('toolbar:read')).toBeInTheDocument();
        expect(screen.queryByTestId('toolbar:unread')).toBeNull();
    });

    it('should show "Mark as read" button when some items are unread', () => {
        mockSelectors({ id1: true, id2: false });
        render(<ReadUnreadButtons {...getProps()} />);

        expect(screen.getByTestId('toolbar:read')).toBeInTheDocument();
        expect(screen.queryByTestId('toolbar:unread')).toBeNull();
    });

    it('should show "Mark as unread" button when all items are read', () => {
        mockSelectors({ id1: false, id2: false });
        render(<ReadUnreadButtons {...getProps()} />);

        expect(screen.queryByTestId('toolbar:read')).toBeNull();
        expect(screen.getByTestId('toolbar:unread')).toBeInTheDocument();
    });

    it('should show both buttons when doing a selectAll', () => {
        mockUseSelectAll.mockReturnValue({ selectAll: true });
        mockSelectors({ id1: true, id2: false });
        render(<ReadUnreadButtons {...getProps()} />);

        expect(screen.getByTestId('toolbar:read')).toBeInTheDocument();
        expect(screen.getByTestId('toolbar:unread')).toBeInTheDocument();
    });
});
