import { renderHook } from '@testing-library/react';

import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { useMailboxCounter } from './useMailboxCounter';

jest.mock('@proton/mail/store/mailSettings/hooks');
const mockUseMailSettings = useMailSettings as jest.Mock;

jest.mock('@proton/mail', () => ({
    ...jest.requireActual('@proton/mail'),
    useLabels: jest.fn(),
    useFolders: jest.fn(),
    useSystemFolders: jest.fn(),
    useConversationCounts: jest.fn(),
    useMessageCounts: jest.fn(),
}));

const mockUseFolders = jest.requireMock('@proton/mail').useFolders;
const mockUseLabels = jest.requireMock('@proton/mail').useLabels;
const mockUseSystemFolders = jest.requireMock('@proton/mail').useSystemFolders;
const mockUseConversationCounts = jest.requireMock('@proton/mail').useConversationCounts;
const mockUseMessageCounts = jest.requireMock('@proton/mail').useMessageCounts;

describe('useMailboxCounter', () => {
    describe('case with no data', () => {
        beforeEach(() => {
            mockUseMailSettings.mockReturnValue([{}, true]);
            mockUseFolders.mockReturnValue([[], true]);
            mockUseLabels.mockReturnValue([[], true]);
            mockUseSystemFolders.mockReturnValue([[], true]);
            mockUseConversationCounts.mockReturnValue([[], true]);
            mockUseMessageCounts.mockReturnValue([[], true]);
        });

        it('should return loading while not all data is loaded', () => {
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current[1]).toEqual(true);
        });

        it('should return an object containing all default mailbox label IDs', () => {
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current).toStrictEqual([{}, true]);
        });
    });

    describe('data is loaded', () => {
        beforeEach(() => {
            mockUseMailSettings.mockReturnValue([{}, false]);
            mockUseFolders.mockReturnValue([
                [
                    {
                        ID: 'custom-folder',
                    },
                ],
                false,
            ]);
            mockUseLabels.mockReturnValue([
                [
                    {
                        ID: 'custom-label',
                    },
                ],
                false,
            ]);
            mockUseSystemFolders.mockReturnValue([[], false]);
            mockUseConversationCounts.mockReturnValue([
                [
                    {
                        LabelID: MAILBOX_LABEL_IDS.INBOX,
                        Total: 1000,
                        Unread: 100,
                    },
                ],
                false,
            ]);
            mockUseMessageCounts.mockReturnValue([
                [
                    {
                        LabelID: MAILBOX_LABEL_IDS.INBOX,
                        Total: 500,
                        Unread: 50,
                    },
                ],
                false,
            ]);
        });

        it('should return loading while not all data is loaded', () => {
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current[1]).toEqual(false);
        });

        it('should return conversation count when default setting', () => {
            const { result } = renderHook(() => useMailboxCounter());

            expect(result.current[0][MAILBOX_LABEL_IDS.INBOX]).toStrictEqual({
                LabelID: MAILBOX_LABEL_IDS.INBOX,
                Total: 1000,
                Unread: 100,
            });
        });

        it('should return conversation count when conversation grouping is disabled', () => {
            mockUseMailSettings.mockReturnValue([{ ViewMode: VIEW_MODE.SINGLE }, false]);
            const { result } = renderHook(() => useMailboxCounter());

            expect(result.current[0][MAILBOX_LABEL_IDS.INBOX]).toStrictEqual({
                LabelID: MAILBOX_LABEL_IDS.INBOX,
                Total: 500,
                Unread: 50,
            });
        });

        it('should return default value count when default setting and the data is not in list', () => {
            const { result } = renderHook(() => useMailboxCounter());

            expect(result.current[0][MAILBOX_LABEL_IDS.ARCHIVE]).toStrictEqual({
                LabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                Total: 0,
                Unread: 0,
            });
        });
    });
});
