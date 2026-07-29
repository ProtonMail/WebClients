import { useHistory, useLocation } from 'react-router';

import { renderHook } from '@testing-library/react-hooks';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import useInboxDesktopElementId from './useInboxDesktopElementId';

// Only the hooks are mocked, `generatePath` is needed to build the pathname
jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useHistory: jest.fn(),
    useLocation: jest.fn(),
}));

const mockPush = jest.fn();

const setup = ({ hash, isSearch = false }: { hash: string; isSearch?: boolean }) => {
    jest.mocked(useLocation).mockReturnValue({ hash } as any);
    jest.mocked(useHistory).mockReturnValue({
        push: mockPush,
        // The category redirect runs before this hook and can already have rewritten the location
        location: { pathname: '/inbox', search: '', hash: '#category=primary' },
    } as any);

    return renderHook(() => useInboxDesktopElementId({ isSearch }));
};

describe('useInboxDesktopElementId', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should open the element on a regular label', () => {
        setup({ hash: `#labelID=${MAILBOX_LABEL_IDS.ARCHIVE}&elementID=conversationID` });

        expect(mockPush).toHaveBeenCalledWith({
            pathname: '/archive/conversationID',
            search: '',
            hash: '',
        });
    });

    it('should redirect a category label to inbox and keep the category in the hash', () => {
        setup({ hash: `#labelID=${MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS}&elementID=conversationID` });

        expect(mockPush).toHaveBeenCalledWith({
            pathname: '/inbox/conversationID',
            search: '',
            hash: '#category=newsletters',
        });
    });

    it('should do nothing when the hash has no element', () => {
        setup({ hash: '#category=primary' });
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('should do nothing while searching', () => {
        setup({ hash: `#labelID=${MAILBOX_LABEL_IDS.INBOX}&elementID=conversationID`, isSearch: true });
        expect(mockPush).not.toHaveBeenCalled();
    });
});
