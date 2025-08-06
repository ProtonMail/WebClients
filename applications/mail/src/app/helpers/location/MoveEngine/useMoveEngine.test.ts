import { renderHook } from '@testing-library/react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { mockUseFolders, mockUseLabels } from '@proton/testing/index';

import { useMoveEngine } from 'proton-mail/helpers/location/MoveEngine/useMoveEngine';
import type { Conversation } from 'proton-mail/models/conversation';
import type { Element } from 'proton-mail/models/element';
import type { ESMessage } from 'proton-mail/models/encryptedSearch';

import { MoveEngineRuleResult } from './moveEngineInterface';

const element = {
    ID: '1',
    ConversationID: '123',
    LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
} as Element;

const sentElement = {
    ...element,
    Flags: MESSAGE_FLAGS.FLAG_SENT,
} as Element;

const newsletterEvent = {
    ID: '1',
    ConversationID: '123',
    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS],
} as Element;

const getNonApplicableError = (element: Element) => ({
    id: element.ID,
    error: MoveEngineRuleResult.NOT_APPLICABLE,
});

describe('useMoveEngine', () => {
    describe('should throw if one of the element is not a message', () => {
        beforeEach(() => {
            mockUseFolders();
            mockUseLabels();
        });

        it('should throw if we try to move a conversation', () => {
            const { result } = renderHook(() => useMoveEngine());
            const conversation = {} as Conversation;
            expect(() =>
                result.current.messageMoveEngine.validateMove(MAILBOX_LABEL_IDS.SPAM, [conversation], false)
            ).toThrow();
        });

        it('should throw if one of the element is a conversation', () => {
            const { result } = renderHook(() => useMoveEngine());
            const conversation = {} as Conversation;
            expect(() =>
                result.current.messageMoveEngine.validateMove(MAILBOX_LABEL_IDS.SPAM, [element, conversation], false)
            ).toThrow();
        });

        it('should not throw if one of the element is a esMessage   ', () => {
            const { result } = renderHook(() => useMoveEngine());
            const element2 = element as ESMessage;
            expect(() =>
                result.current.messageMoveEngine.validateMove(MAILBOX_LABEL_IDS.SPAM, [element, element2], false)
            ).not.toThrow();
        });

        it('should throw if we try to reach for a rule that does not exist', () => {
            const { result } = renderHook(() => useMoveEngine());
            expect(() => result.current.messageMoveEngine.validateMove('unknown-label-id', [element], false)).toThrow();
        });
    });

    describe('non custom folder and label test', () => {
        beforeEach(() => {
            mockUseFolders();
            mockUseLabels();
        });

        it('should allow to move one message from inbox to spam', async () => {
            const { result } = renderHook(() => useMoveEngine());

            const res = result.current.messageMoveEngine.validateMove(MAILBOX_LABEL_IDS.SPAM, [element], false);
            expect(res).toStrictEqual({
                allowedElements: [element],
                deniedElements: [],
                notApplicableElements: [],
                errors: [],
            });
        });

        it('should allow me to move mulpiple messages from inbox to spam', async () => {
            const { result } = renderHook(() => useMoveEngine());

            const element2 = {
                ID: '2',
                ConversationID: '123',
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
            } as Element;

            const res = result.current.messageMoveEngine.validateMove(
                MAILBOX_LABEL_IDS.SPAM,
                [element, element2],
                false
            );
            expect(res).toStrictEqual({
                allowedElements: [element, element2],
                deniedElements: [],
                notApplicableElements: [],
                errors: [],
            });
        });

        it('should not allow to move one message from Inbox to Inbox, no error', async () => {
            const { result } = renderHook(() => useMoveEngine());

            const res = result.current.messageMoveEngine.validateMove(MAILBOX_LABEL_IDS.INBOX, [element], false);
            expect(res).toStrictEqual({
                allowedElements: [],
                deniedElements: [],
                notApplicableElements: [element],
                errors: [getNonApplicableError(element)],
            });
        });

        it('should not allow me to move multiple messages from Inbox to Inbox, no error', async () => {
            const { result } = renderHook(() => useMoveEngine());

            const element2 = {
                ID: '2',
                ConversationID: '123',
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
            } as Element;

            const res = result.current.messageMoveEngine.validateMove(
                MAILBOX_LABEL_IDS.INBOX,
                [element, element2],
                false
            );
            expect(res).toStrictEqual({
                allowedElements: [],
                deniedElements: [],
                notApplicableElements: [element, element2],
                errors: [getNonApplicableError(element), getNonApplicableError(element2)],
            });
        });

        it('should allow to move one sent message to spam', async () => {
            const { result } = renderHook(() => useMoveEngine());

            const res = result.current.messageMoveEngine.validateMove(MAILBOX_LABEL_IDS.SPAM, [sentElement], false);
            expect(res).toStrictEqual({
                allowedElements: [sentElement],
                deniedElements: [],
                notApplicableElements: [],
                errors: [],
            });
        });

        it('should allow to move multiple sent messages to spam', async () => {
            const { result } = renderHook(() => useMoveEngine());
            const sentElement2 = {
                ...sentElement,
                ID: '2',
                Flags: MESSAGE_FLAGS.FLAG_SENT,
            } as Element;

            const res = result.current.messageMoveEngine.validateMove(
                MAILBOX_LABEL_IDS.SPAM,
                [sentElement, sentElement2],
                false
            );
            expect(res).toStrictEqual({
                allowedElements: [sentElement, sentElement2],
                deniedElements: [],
                notApplicableElements: [],
                errors: [],
            });
        });

        it('should allow all messages to spam', async () => {
            const { result } = renderHook(() => useMoveEngine());
            const sentElement2 = {
                ...sentElement,
                ID: '2',
            } as Element;

            const element3 = {
                ...element,
                ID: '3',
            } as Element;

            const res = result.current.messageMoveEngine.validateMove(
                MAILBOX_LABEL_IDS.SPAM,
                [sentElement, sentElement2, element3],
                false
            );
            expect(res).toStrictEqual({
                allowedElements: [sentElement, sentElement2, element3],
                deniedElements: [],
                notApplicableElements: [],
                errors: [],
            });
        });
    });

    describe('categories tests', () => {
        beforeEach(() => {
            mockUseFolders();
            mockUseLabels();
        });

        it('should allow to move one message from inbox to category', async () => {
            const { result } = renderHook(() => useMoveEngine());

            const res = result.current.messageMoveEngine.validateMove(
                MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                [element],
                false
            );
            expect(res).toStrictEqual({
                allowedElements: [element],
                deniedElements: [],
                notApplicableElements: [],
                errors: [],
            });
        });

        it('should allow to move one message from one category to another', async () => {
            const { result } = renderHook(() => useMoveEngine());

            const res = result.current.messageMoveEngine.validateMove(
                MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                [newsletterEvent],
                false
            );
            expect(res).toStrictEqual({
                allowedElements: [newsletterEvent],
                deniedElements: [],
                notApplicableElements: [],
                errors: [],
            });
        });

        it('should not allow to move one message to the same category   ', async () => {
            const { result } = renderHook(() => useMoveEngine());

            const res = result.current.messageMoveEngine.validateMove(
                MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                [newsletterEvent],
                false
            );
            expect(res).toStrictEqual({
                allowedElements: [],
                deniedElements: [],
                notApplicableElements: [newsletterEvent],
                errors: [getNonApplicableError(newsletterEvent)],
            });
        });

        it('should only allow messages in different categories to be moved to the a category', async () => {
            const { result } = renderHook(() => useMoveEngine());

            const socialEvent = {
                ...newsletterEvent,
                LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL],
            } as Element;

            const res = result.current.messageMoveEngine.validateMove(
                MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                [newsletterEvent, socialEvent],
                false
            );
            expect(res).toStrictEqual({
                allowedElements: [newsletterEvent],
                deniedElements: [],
                notApplicableElements: [socialEvent],
                errors: [getNonApplicableError(socialEvent)],
            });
        });
    });

    describe('custom folder and label test', () => {
        const customFolderID = 'custom-folder-1';
        const customLabelID = 'custom-label-1';

        beforeEach(() => {
            mockUseFolders([
                [
                    {
                        ID: 'custom-folder-1',
                        Name: 'Custom Folder 1',
                    } as Folder,
                ],
            ]);

            mockUseLabels([
                [
                    {
                        ID: 'custom-label-1',
                        Name: 'Custom Label 1',
                    } as Label,
                ],
            ]);
        });

        it('should allow to move one message from inbox to custom folder', async () => {
            const { result } = renderHook(() => useMoveEngine());

            const res = result.current.messageMoveEngine.validateMove(customFolderID, [element], false);
            expect(res).toStrictEqual({
                allowedElements: [element],
                deniedElements: [],
                notApplicableElements: [],
                errors: [],
            });
        });

        it('should allow to move one message from inbox to custom label', async () => {
            const { result } = renderHook(() => useMoveEngine());

            const res = result.current.messageMoveEngine.validateMove(customLabelID, [element], false);
            expect(res).toStrictEqual({
                allowedElements: [element],
                deniedElements: [],
                notApplicableElements: [],
                errors: [],
            });
        });

        it('should not allow to move one folder to custom folder if already in the folder', async () => {
            const { result } = renderHook(() => useMoveEngine());
            const customElement = {
                ...element,
                LabelIDs: [customFolderID],
            } as Element;

            const res = result.current.messageMoveEngine.validateMove(customFolderID, [customElement], false);
            expect(res).toStrictEqual({
                allowedElements: [],
                deniedElements: [],
                notApplicableElements: [customElement],
                errors: [getNonApplicableError(customElement)],
            });
        });

        it('should not allow to move one label to custom label if already in the label', async () => {
            const { result } = renderHook(() => useMoveEngine());
            const customElement = {
                ...element,
                LabelIDs: [customLabelID],
            } as Element;

            const res = result.current.messageMoveEngine.validateMove(customLabelID, [customElement], false);
            expect(res).toStrictEqual({
                allowedElements: [],
                deniedElements: [],
                notApplicableElements: [customElement],
                errors: [getNonApplicableError(customElement)],
            });
        });

        it('should only allow messages in different folders to be moved to the a folder', async () => {
            const { result } = renderHook(() => useMoveEngine());

            const customElement = {
                ...element,
                LabelIDs: [customFolderID],
            } as Element;

            const res = result.current.messageMoveEngine.validateMove(customFolderID, [element, customElement], false);
            expect(res).toStrictEqual({
                allowedElements: [element],
                deniedElements: [],
                notApplicableElements: [customElement],
                errors: [getNonApplicableError(customElement)],
            });
        });

        it('should only allow messages in different labels to be moved to the a label', async () => {
            const { result } = renderHook(() => useMoveEngine());

            const customElement = {
                ...element,
                LabelIDs: [customLabelID],
            } as Element;

            const res = result.current.messageMoveEngine.validateMove(customLabelID, [element, customElement], false);
            expect(res).toStrictEqual({
                allowedElements: [element],
                deniedElements: [],
                notApplicableElements: [customElement],
                errors: [getNonApplicableError(customElement)],
            });
        });
    });
});
