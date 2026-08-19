import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import type { Folder, MailSettings } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';

import { HIDE_SNOOZE_CONFIRMATION_LS_KEY } from '../../../components/list/snooze/constant';
import { ModalType } from '../../../containers/globalModals/inteface';
import type { Element } from '../../../models/element';
import type { ConversationState } from '../../../store/conversations/conversationsTypes';

import {
    shouldOpenConfirmationModalForConverversation,
    shouldOpenConfirmationModalForMessages,
} from './shouldOpenModal';

describe('shouldOpenConfirmationModalForMessages', () => {
    describe('Schedule modal', () => {
        it('should return schedule modal if the element is scheduled and moved to TRASH', () => {
            const result = shouldOpenConfirmationModalForMessages({
                elements: [
                    {
                        ConversationID: '123',
                        LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                mailSettings: {} as MailSettings,
            });

            expect(result).toBe(ModalType.Schedule);
        });

        it('should return null if element is empty', () => {
            const result = shouldOpenConfirmationModalForMessages({
                elements: [],
                destinationLabelID: '123',
                mailSettings: {} as MailSettings,
            });

            expect(result).toBeNull();
        });

        it('should return null if the element does not have the schedule label', () => {
            const result = shouldOpenConfirmationModalForMessages({
                elements: [
                    {
                        ConversationID: '123',
                        LabelIDs: [],
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.SCHEDULED,
                mailSettings: {} as MailSettings,
            });

            expect(result).toBeNull();
        });

        it('should return null if the target of schedule message is the schedule folder', () => {
            const result = shouldOpenConfirmationModalForMessages({
                elements: [
                    {
                        ConversationID: '123',
                        LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.SCHEDULED,
                mailSettings: {} as MailSettings,
            });

            expect(result).toBeNull();
        });
    });

    describe('Unsubscribe modal', () => {
        it('should return null if the element has no unsubscribe method', () => {
            const result = shouldOpenConfirmationModalForMessages({
                elements: [
                    {
                        ConversationID: '123',
                        LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                mailSettings: {
                    SpamAction: null,
                } as MailSettings,
            });

            expect(result).toBeNull();
        });

        it('should return null if the element has unsubscribe method but the user has set the setting already', () => {
            const result = shouldOpenConfirmationModalForMessages({
                elements: [
                    {
                        ConversationID: '123',
                        LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                        UnsubscribeMethods: {
                            OneClick: 'test',
                        },
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                mailSettings: {
                    SpamAction: SPAM_ACTION.JustSpam,
                } as MailSettings,
            });

            expect(result).toBeNull();
        });

        it('should return null if the element has unsubscribe method, the user has not set the setting but target is not spam', () => {
            const result = shouldOpenConfirmationModalForMessages({
                elements: [
                    {
                        ConversationID: '123',
                        LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                        UnsubscribeMethods: {
                            OneClick: 'test',
                        },
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.SCHEDULED,
                mailSettings: {
                    SpamAction: null,
                } as MailSettings,
            });

            expect(result).toBeNull();
        });

        it('should return modal if the element has unsubscribe method, the user has not set the setting and target is spam', () => {
            const result = shouldOpenConfirmationModalForMessages({
                elements: [
                    {
                        ConversationID: '123',
                        LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                        UnsubscribeMethods: {
                            OneClick: 'test',
                        },
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                mailSettings: {
                    SpamAction: null,
                } as MailSettings,
            });

            expect(result).toBe(ModalType.Unsubscribe);
        });
    });
});

describe('shouldOpenConfirmationModalForConverversation', () => {
    describe('Schedule modal', () => {
        it('should return schedule modal if the element is scheduled and moved to TRASH', () => {
            const result = shouldOpenConfirmationModalForConverversation({
                elements: [
                    {
                        ConversationID: '123',
                        Labels: [{ ID: MAILBOX_LABEL_IDS.SCHEDULED, ContextNumMessages: 1 }],
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                mailSettings: {} as MailSettings,
                folders: [],
                conversationsFromState: [undefined],
            });

            expect(result).toBe(ModalType.Schedule);
        });

        it('should return null if the element is empty', () => {
            const result = shouldOpenConfirmationModalForConverversation({
                elements: [],
                destinationLabelID: '123',
                mailSettings: {} as MailSettings,
                folders: [],
                conversationsFromState: [undefined],
            });

            expect(result).toBeNull();
        });

        it('should return null if the element does not have the schedule label', () => {
            const result = shouldOpenConfirmationModalForConverversation({
                elements: [
                    {
                        ConversationID: '123',
                        LabelIDs: [],
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.SCHEDULED,
                mailSettings: {} as MailSettings,
                folders: [],
                conversationsFromState: [undefined],
            });

            expect(result).toBeNull();
        });

        it('should return null if the target of schedule message is the schedule folder', () => {
            const result = shouldOpenConfirmationModalForConverversation({
                elements: [
                    {
                        ConversationID: '123',
                        LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.SCHEDULED,
                mailSettings: {} as MailSettings,
                folders: [],
                conversationsFromState: [undefined],
            });

            expect(result).toBeNull();
        });
    });

    describe('Snooze modal', () => {
        it.each([
            [MAILBOX_LABEL_IDS.INBOX],
            [MAILBOX_LABEL_IDS.TRASH],
            [MAILBOX_LABEL_IDS.SPAM],
            [MAILBOX_LABEL_IDS.ARCHIVE],
            [MAILBOX_LABEL_IDS.SENT],
            [MAILBOX_LABEL_IDS.DRAFTS],
            ['custom-folder'],
        ])(
            'should return snooze modal if the element is snooze and moved to warning folder %s',
            (destinationLabelID) => {
                const result = shouldOpenConfirmationModalForConverversation({
                    elements: [
                        {
                            ConversationID: '123',
                            Labels: [{ ID: MAILBOX_LABEL_IDS.SNOOZED, ContextNumMessages: 1 }],
                        } as unknown as Element,
                    ],
                    destinationLabelID,
                    mailSettings: {} as MailSettings,
                    folders: [
                        {
                            ID: 'custom-folder',
                        } as Folder,
                    ],
                    conversationsFromState: [undefined],
                });

                expect(result).toBe(ModalType.Snooze);
            }
        );

        it('should return null if the element is not snoozed', () => {
            const result = shouldOpenConfirmationModalForConverversation({
                elements: [
                    {
                        ConversationID: '123',
                        Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 1 }],
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                mailSettings: {} as MailSettings,
                folders: [],
                conversationsFromState: [undefined],
            });

            expect(result).toBeNull();
        });

        describe('when "Don\'t ask again" has been selected', () => {
            beforeEach(() => {
                setItem(HIDE_SNOOZE_CONFIRMATION_LS_KEY, 'true');
            });

            afterEach(() => {
                removeItem(HIDE_SNOOZE_CONFIRMATION_LS_KEY);
            });

            it('should return null even if the element is snoozed', () => {
                const result = shouldOpenConfirmationModalForConverversation({
                    elements: [
                        {
                            ConversationID: '123',
                            Labels: [{ ID: MAILBOX_LABEL_IDS.SNOOZED, ContextNumMessages: 1 }],
                        } as unknown as Element,
                    ],
                    destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                    mailSettings: {} as MailSettings,
                    folders: [],
                    conversationsFromState: [undefined],
                });

                expect(result).toBeNull();
            });

            it('should still return the schedule modal, which is unaffected by the snooze preference', () => {
                const result = shouldOpenConfirmationModalForConverversation({
                    elements: [
                        {
                            ConversationID: '123',
                            Labels: [{ ID: MAILBOX_LABEL_IDS.SCHEDULED, ContextNumMessages: 1 }],
                        } as unknown as Element,
                    ],
                    destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                    mailSettings: {} as MailSettings,
                    folders: [],
                    conversationsFromState: [undefined],
                });

                expect(result).toBe(ModalType.Schedule);
            });
        });
    });

    describe('Unsubscribe modal', () => {
        it('should return null if the element has no unsubscribe method', () => {
            const result = shouldOpenConfirmationModalForConverversation({
                elements: [
                    {
                        ConversationID: '123',
                        LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                mailSettings: {
                    SpamAction: null,
                } as MailSettings,
                folders: [],
                conversationsFromState: [undefined],
            });

            expect(result).toBeNull();
        });

        it('should return null if the element has unsubscribe method but the user has set the setting already', () => {
            const result = shouldOpenConfirmationModalForConverversation({
                elements: [
                    {
                        ConversationID: '123',
                        LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                        UnsubscribeMethods: {
                            OneClick: 'test',
                        },
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                mailSettings: {
                    SpamAction: SPAM_ACTION.JustSpam,
                } as MailSettings,
                folders: [],
                conversationsFromState: [undefined],
            });

            expect(result).toBeNull();
        });

        it('should return null if the element has unsubscribe method, the user has not set the setting but target is not spam', () => {
            const result = shouldOpenConfirmationModalForConverversation({
                elements: [
                    {
                        ConversationID: '123',
                        LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                        UnsubscribeMethods: {
                            OneClick: 'test',
                        },
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.SCHEDULED,
                mailSettings: {
                    SpamAction: null,
                } as MailSettings,
                folders: [],
                conversationsFromState: [undefined],
            });

            expect(result).toBeNull();
        });

        it('should return modal if the element has not one click unsubscribe method, the user has not set the setting and target is spam', () => {
            const result = shouldOpenConfirmationModalForConverversation({
                elements: [
                    {
                        ConversationID: '123',
                        LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                        UnsubscribeMethods: {
                            OneClick: 'test',
                        },
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                mailSettings: {
                    SpamAction: null,
                } as MailSettings,
                folders: [],
                conversationsFromState: [
                    {
                        Messages: [
                            {
                                UnsubscribeMethods: {
                                    HttpClient: 'OneClick',
                                },
                            } as Message,
                        ],
                    } as ConversationState,
                ],
            });

            expect(result).toBeNull();
        });

        it('should return modal if the element has unsubscribe method, the user has not set the setting and target is spam', () => {
            const result = shouldOpenConfirmationModalForConverversation({
                elements: [
                    {
                        ConversationID: '123',
                        LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                        UnsubscribeMethods: {
                            OneClick: 'test',
                        },
                    } as unknown as Element,
                ],
                destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                mailSettings: {
                    SpamAction: null,
                } as MailSettings,
                folders: [],
                conversationsFromState: [
                    {
                        Messages: [
                            {
                                UnsubscribeMethods: {
                                    OneClick: 'OneClick',
                                },
                            } as Message,
                        ],
                    } as ConversationState,
                ],
            });

            expect(result).toBe(ModalType.Unsubscribe);
        });
    });
});
