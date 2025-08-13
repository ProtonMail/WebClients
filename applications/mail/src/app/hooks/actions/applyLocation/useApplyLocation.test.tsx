import type { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';
import { mockUseFolders, mockUseLabels } from '@proton/testing';
import { mockUseMailSettings } from '@proton/testing/lib/mockUseMailSettings';

import { GlobalModalContext } from 'proton-mail/containers/globalModals/GlobalModalProvider';
import { ModalType } from 'proton-mail/containers/globalModals/inteface';
import { scheduleTargetWithWarning } from 'proton-mail/helpers/location/moveModal/shouldOpenModal';
import { labelMessages, unlabelMessages } from 'proton-mail/store/mailbox/mailboxActions';

import { APPLY_LOCATION_TYPES } from './interface';
import { useApplyLocation } from './useApplyLocation';

jest.mock('proton-mail/containers/globalModals/GlobalSnoozeModal');
jest.mock('proton-mail/containers/globalModals/GlobalScheduleModal');
jest.mock('proton-mail/containers/globalModals/GlobalUnsubscribeModal');

jest.mock('proton-mail/store/mailbox/mailboxActions');
//@ts-ignore
const mockedLabelMessages = labelMessages as jest.Mock;
//@ts-ignore
const mockedUnlabelMessages = unlabelMessages as jest.Mock;

const mockUseGetConversation = jest.fn();
jest.mock('proton-mail/hooks/conversation/useConversation', () => ({
    useGetConversation: () => mockUseGetConversation,
}));

const mockUseGetElementByID = jest.fn();
jest.mock('proton-mail/hooks/mailbox/useElements', () => ({
    useGetElementByID: () => mockUseGetElementByID,
}));

jest.mock('proton-mail/store/hooks', () => ({
    useMailDispatch: jest.fn().mockReturnValue(jest.fn()),
    useMailSelector: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock('proton-mail/hooks/actions/moveBackAction/useMoveBackAction', () => ({
    useMoveBackAction: jest.fn().mockReturnValue(jest.fn()),
}));
jest.mock('proton-mail/hooks/actions/useCreateFilters', () => ({
    useCreateFilters: jest.fn(() => ({
        getSendersToFilter: jest.fn(),
        getFilterActions: jest.fn(() => ({
            getSendersToFilter: jest.fn(),
            doCreateFilters: jest.fn(),
            undoCreateFilters: jest.fn(),
        })),
    })),
}));

const mockedCreateNotification = jest.fn();
jest.mock('@proton/components', () => {
    return {
        useNotifications: jest.fn(() => ({ createNotification: mockedCreateNotification })),
    };
});

const notifyMock = jest.fn();
const subscribeMock = jest.fn();

const wrapper = ({ children }: { children: ReactNode }) => (
    <GlobalModalContext.Provider value={{ notify: notifyMock, subscribe: subscribeMock }}>
        {children}
    </GlobalModalContext.Provider>
);

describe('useApplyLocation', () => {
    beforeEach(() => {
        mockUseFolders();
        mockUseLabels();
        mockUseMailSettings();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('safety net', () => {
        it('should throw if element is undefined', () => {
            const { result } = renderHook(() => useApplyLocation(), { wrapper });

            expect(() =>
                result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    // @ts-ignore
                    elements: undefined,
                    targetLabelID: '10',
                })
            ).toThrow('Elements are required');
        });

        it('should not throw is element is empty array', () => {
            const { result } = renderHook(() => useApplyLocation(), { wrapper });

            expect(() =>
                result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    // @ts-ignore
                    elements: [],
                    targetLabelID: '10',
                })
            ).not.toThrow();
        });
    });

    describe('messages tests', () => {
        describe('messages notifications tests', () => {
            it('should display error notification when only denied moveds', async () => {
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [{ ID: '1', ConversationID: '123', Flags: MESSAGE_FLAGS.FLAG_SENT }],
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                });

                expect(mockedCreateNotification).toHaveBeenCalledWith({
                    text: 'This action cannot be performed',
                    type: 'error',
                });
            });

            it('should not display a notification if only one is denied', async () => {
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [
                        { ID: '1', ConversationID: '123', Flags: MESSAGE_FLAGS.FLAG_SENT },
                        { ID: '1', ConversationID: '123', LabelIDs: [MAILBOX_LABEL_IDS.ARCHIVE] },
                    ],
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                });

                expect(mockedCreateNotification).not.toHaveBeenCalled();
            });

            it('should display info notification when the move is not applicable', async () => {
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [{ ID: '1', ConversationID: '123', LabelIDs: [MAILBOX_LABEL_IDS.INBOX] }],
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                });

                expect(mockedCreateNotification).toHaveBeenCalledWith({
                    text: 'No change will be made to the selected emails',
                    type: 'info',
                });
            });

            it('should not display info notification when only one is not applicable', async () => {
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [
                        { ID: '1', ConversationID: '123', LabelIDs: [MAILBOX_LABEL_IDS.INBOX] },
                        { ID: '1', ConversationID: '123', LabelIDs: [MAILBOX_LABEL_IDS.ARCHIVE] },
                    ],
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                });

                expect(mockedCreateNotification).not.toHaveBeenCalled();
            });
        });

        describe('modal tests', () => {
            it.each(Array.from(scheduleTargetWithWarning))(
                'should display schedule modal when moving from schedule to trash %s',
                async (targetLabelID) => {
                    const { result } = renderHook(() => useApplyLocation(), { wrapper });

                    await result.current.applyLocation({
                        type: APPLY_LOCATION_TYPES.MOVE,
                        elements: [{ ID: '1', ConversationID: '123', LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED] }],
                        targetLabelID,
                    });

                    expect(notifyMock).toHaveBeenCalled();
                    expect(notifyMock).toHaveBeenCalledWith(
                        expect.objectContaining({
                            type: ModalType.Schedule,
                        })
                    );
                }
            );

            it('should not call the schedule modal when moving schedule message to non blocked folder', async () => {
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [{ ID: '1', ConversationID: '123', LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED] }],
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                });

                expect(notifyMock).not.toHaveBeenCalled();
            });

            it('should open the unsubscribe modal when moving one click newlsetter to spam', async () => {
                mockUseMailSettings([
                    {
                        SpamAction: null,
                    },
                ]);
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [
                        {
                            ID: '1',
                            ConversationID: '123',
                            UnsubscribeMethods: {
                                OneClick: 'OneClick',
                            },
                        },
                    ],
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                });

                expect(notifyMock).toHaveBeenCalled();
                expect(notifyMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: ModalType.Unsubscribe,
                    })
                );
            });

            it('should not open the unsubscribe modal when moving https client newlsetter to spam', async () => {
                mockUseMailSettings([
                    {
                        SpamAction: null,
                    },
                ]);
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [
                        {
                            ID: '1',
                            ConversationID: '123',
                            UnsubscribeMethods: {
                                HttpClient: 'OneClick',
                            },
                        },
                    ],
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                });

                expect(notifyMock).not.toHaveBeenCalled();
            });

            it('should not the unsubscribe modal when moving one click newlsetter to spam and user has the setting', async () => {
                mockUseMailSettings([
                    {
                        SpamAction: SPAM_ACTION.JustSpam,
                    },
                ]);
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [
                        {
                            ID: '1',
                            ConversationID: '123',
                            UnsubscribeMethods: {
                                OneClick: 'OneClick',
                            },
                        },
                    ],
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                });

                expect(notifyMock).not.toHaveBeenCalled();
            });
        });

        describe('dispatch tests', () => {
            it('should dispatch one element', async () => {
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                const element = {
                    ID: '1',
                    ConversationID: '123',
                    LabelIDs: [MAILBOX_LABEL_IDS.ARCHIVE],
                };

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [element],
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                });

                expect(mockedLabelMessages).toHaveBeenCalledWith({
                    isEncryptedSearch: false,
                    showSuccessNotification: true,
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                    labels: [],
                    folders: [],
                    elements: [element],
                    conversations: [],
                    sourceLabelID: undefined,
                    spamAction: undefined,
                    onActionUndo: expect.any(Function),
                });
                expect(mockedUnlabelMessages).not.toHaveBeenCalled();
            });

            it('should only dispatch the allowed element', async () => {
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                const element = {
                    ID: '1',
                    ConversationID: '123',
                    LabelIDs: [MAILBOX_LABEL_IDS.ARCHIVE],
                };

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [element, { ...element, LabelIDs: [MAILBOX_LABEL_IDS.INBOX] }],
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                });

                expect(mockedLabelMessages).toHaveBeenCalledWith({
                    isEncryptedSearch: false,
                    showSuccessNotification: true,
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                    labels: [],
                    folders: [],
                    elements: [element],
                    conversations: [],
                    sourceLabelID: undefined,
                    spamAction: undefined,
                    onActionUndo: expect.any(Function),
                });
                expect(mockedUnlabelMessages).not.toHaveBeenCalled();
            });

            it('should dispatch one element', async () => {
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                const element = {
                    ID: '1',
                    ConversationID: '123',
                    LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.STARRED],
                };

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.STAR,
                    elements: [element],
                    targetLabelID: MAILBOX_LABEL_IDS.STARRED,
                    removeLabel: true,
                });

                expect(mockedLabelMessages).not.toHaveBeenCalled();
                expect(mockedUnlabelMessages).toHaveBeenCalledWith({
                    isEncryptedSearch: false,
                    showSuccessNotification: true,
                    targetLabelID: MAILBOX_LABEL_IDS.STARRED,
                    labels: [],
                    folders: [],
                    elements: [element],
                    conversations: [],
                    onActionUndo: expect.any(Function),
                    sourceLabelID: undefined,
                });
            });
        });
    });

    describe('conversations tests', () => {
        describe('messages notifications tests', () => {
            it('should display error notification when only denied moveds', async () => {
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [
                        {
                            ID: '1',
                            Labels: [
                                {
                                    ID: MAILBOX_LABEL_IDS.SCHEDULED,
                                    ContextNumMessages: 10,
                                },
                            ],
                            NumMessages: 10,
                        },
                    ],
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                });

                expect(mockedCreateNotification).toHaveBeenCalledWith({
                    text: 'This action cannot be performed',
                    type: 'error',
                });
            });

            it('should not display a notification if only one is denied', async () => {
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [
                        {
                            ID: '1',
                            Labels: [
                                {
                                    ID: MAILBOX_LABEL_IDS.SCHEDULED,
                                    ContextNumMessages: 10,
                                },
                            ],
                            NumMessages: 10,
                        },
                        {
                            ID: '2',
                            Labels: [
                                {
                                    ID: MAILBOX_LABEL_IDS.SCHEDULED,
                                    ContextNumMessages: 1,
                                },
                            ],
                            NumMessages: 10,
                        },
                    ],
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                });

                expect(mockedCreateNotification).not.toHaveBeenCalled();
            });

            it('should display info notification when the move is not applicable', async () => {
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.STAR,
                    elements: [
                        {
                            ID: '1',
                            NumMessages: 10,
                            Labels: [
                                {
                                    ID: MAILBOX_LABEL_IDS.STARRED,
                                    ContextNumMessages: 10,
                                },
                            ],
                        },
                    ],
                    targetLabelID: MAILBOX_LABEL_IDS.STARRED,
                });

                expect(mockedCreateNotification).toHaveBeenCalledWith({
                    text: 'No change will be made to the selected emails',
                    type: 'info',
                });
            });

            it('should not display info notification when only one is not applicable', async () => {
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.STAR,
                    elements: [
                        {
                            ID: '1',
                            NumMessages: 10,
                            Labels: [
                                {
                                    ID: MAILBOX_LABEL_IDS.STARRED,
                                    ContextNumMessages: 10,
                                },
                            ],
                        },
                        {
                            ID: '1',
                            NumMessages: 10,
                            Labels: [
                                {
                                    ID: MAILBOX_LABEL_IDS.STARRED,
                                    ContextNumMessages: 1,
                                },
                            ],
                        },
                    ],
                    targetLabelID: MAILBOX_LABEL_IDS.STARRED,
                });

                expect(mockedCreateNotification).not.toHaveBeenCalled();
            });
        });

        describe('modal tests', () => {
            it.each(Array.from(scheduleTargetWithWarning))(
                'should display schedule modal when moving from schedule to trash %s',
                async (targetLabelID) => {
                    const { result } = renderHook(() => useApplyLocation(), { wrapper });

                    await result.current.applyLocation({
                        type: APPLY_LOCATION_TYPES.MOVE,
                        elements: [
                            {
                                ID: '1',
                                NumMessages: 10,
                                Labels: [
                                    {
                                        ID: MAILBOX_LABEL_IDS.SCHEDULED,
                                        ContextNumMessages: 10,
                                    },
                                ],
                            },
                        ],
                        targetLabelID,
                    });

                    expect(notifyMock).toHaveBeenCalled();
                    expect(notifyMock).toHaveBeenCalledWith(
                        expect.objectContaining({
                            type: ModalType.Schedule,
                        })
                    );
                }
            );

            it('should not call the schedule modal when moving schedule message to non blocked folder', async () => {
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [
                        {
                            ID: '1',
                            NumMessages: 10,
                            Labels: [
                                {
                                    ID: MAILBOX_LABEL_IDS.SCHEDULED,
                                    ContextNumMessages: 10,
                                },
                            ],
                        },
                    ],
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                });

                expect(notifyMock).not.toHaveBeenCalled();
            });

            it('should call the snooze modal when moving element out of snooze', async () => {
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [
                        {
                            ID: '1',
                            NumMessages: 10,
                            Labels: [
                                {
                                    ID: MAILBOX_LABEL_IDS.SNOOZED,
                                    ContextNumMessages: 10,
                                },
                            ],
                        },
                    ],
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                });

                expect(notifyMock).toHaveBeenCalled();
                expect(notifyMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: ModalType.Snooze,
                    })
                );
            });

            it('should open the unsubscribe modal when moving one click newlsetter to spam', async () => {
                mockUseGetConversation.mockReturnValue({
                    Messages: [
                        {
                            ID: '1',
                            UnsubscribeMethods: {
                                OneClick: 'OneClick',
                            },
                        },
                    ],
                });
                mockUseMailSettings([
                    {
                        SpamAction: null,
                    },
                ]);

                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [
                        {
                            ID: '1',
                            NumMessages: 10,
                            Labels: [
                                {
                                    ID: MAILBOX_LABEL_IDS.STARRED,
                                    ContextNumMessages: 1,
                                },
                            ],
                        },
                    ],
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                });

                expect(notifyMock).toHaveBeenCalled();
                expect(notifyMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: ModalType.Unsubscribe,
                    })
                );
            });

            it('should not open the unsubscribe modal when moving https client newlsetter to spam', async () => {
                mockUseGetConversation.mockReturnValue({
                    Messages: [
                        {
                            ID: '1',
                            UnsubscribeMethods: {
                                HttpClient: 'OneClick',
                            },
                        },
                    ],
                });
                mockUseMailSettings([
                    {
                        SpamAction: null,
                    },
                ]);
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [
                        {
                            ID: '1',
                            NumMessages: 10,
                            Labels: [
                                {
                                    ID: MAILBOX_LABEL_IDS.STARRED,
                                    ContextNumMessages: 1,
                                },
                            ],
                        },
                    ],
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                });

                expect(notifyMock).not.toHaveBeenCalled();
            });

            it('should not the unsubscribe modal when moving one click newlsetter to spam and user has the setting', async () => {
                mockUseGetConversation.mockReturnValue({
                    Messages: [
                        {
                            ID: '1',
                            UnsubscribeMethods: {
                                OneClick: 'OneClick',
                            },
                        },
                    ],
                });
                mockUseMailSettings([
                    {
                        SpamAction: SPAM_ACTION.JustSpam,
                    },
                ]);
                const { result } = renderHook(() => useApplyLocation(), { wrapper });

                await result.current.applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: [
                        {
                            ID: '1',
                            NumMessages: 10,
                            Labels: [
                                {
                                    ID: MAILBOX_LABEL_IDS.STARRED,
                                    ContextNumMessages: 1,
                                },
                            ],
                        },
                    ],
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                });

                expect(notifyMock).not.toHaveBeenCalled();
            });
        });

        // TODO
        describe('dispatch tests', () => {});
    });
});
