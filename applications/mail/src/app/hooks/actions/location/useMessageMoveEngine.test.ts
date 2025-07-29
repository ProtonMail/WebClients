import { renderHook } from '@testing-library/react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { mockUseFolders, mockUseLabels } from '@proton/testing/index';

import type { Conversation } from 'proton-mail/models/conversation';
import type { Element } from 'proton-mail/models/element';
import type { ESMessage } from 'proton-mail/models/encryptedSearch';

import { MoveEngineRuleResult } from './moveEngineInterface';
import { useMessageMoveEngine } from './useMessageMoveEngine';

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

const getDeniedError = (element: Element) => ({
    id: element.ID,
    error: MoveEngineRuleResult.DENIED,
});

describe('useMessageMoveEngine', () => {
    describe('should throw if one of the element is not a message', () => {
        beforeEach(() => {
            mockUseFolders();
            mockUseLabels();
        });

        it('should throw if we try to move a conversation', () => {
            const { result } = renderHook(() => useMessageMoveEngine());
            const conversation = {} as Conversation;
            expect(() => result.current.validateMove(MAILBOX_LABEL_IDS.SPAM, [conversation])).toThrow();
        });

        it('should throw if one of the element is a conversation', () => {
            const { result } = renderHook(() => useMessageMoveEngine());
            const conversation = {} as Conversation;
            expect(() => result.current.validateMove(MAILBOX_LABEL_IDS.SPAM, [element, conversation])).toThrow();
        });

        it('should not throw if one of the element is a esMessage   ', () => {
            const { result } = renderHook(() => useMessageMoveEngine());
            const element2 = element as ESMessage;
            expect(() => result.current.validateMove(MAILBOX_LABEL_IDS.SPAM, [element, element2])).not.toThrow();
        });

        it('should throw if we try to reach for a rule that does not exist', () => {
            const { result } = renderHook(() => useMessageMoveEngine());
            expect(() => result.current.validateMove('unknown-label-id', [element])).toThrow();
        });
    });

    describe('non custom folder and label test', () => {
        beforeEach(() => {
            mockUseFolders();
            mockUseLabels();
        });

        it('should allow to move one message from inbox to spam', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());

            const res = result.current.validateMove(MAILBOX_LABEL_IDS.SPAM, [element]);
            expect(res).toStrictEqual({
                allowedElements: [element],
                deniedElements: [],
                notApplicableElements: [],
                errors: [],
            });
        });

        it('should allow me to move mulpiple messages from inbox to spam', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());

            const element2 = {
                ID: '2',
                ConversationID: '123',
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
            } as Element;

            const res = result.current.validateMove(MAILBOX_LABEL_IDS.SPAM, [element, element2]);
            expect(res).toStrictEqual({
                allowedElements: [element, element2],
                deniedElements: [],
                notApplicableElements: [],
                errors: [],
            });
        });

        it('should not allow to move one message from Inbox to Inbox, no error', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());

            const res = result.current.validateMove(MAILBOX_LABEL_IDS.INBOX, [element]);
            expect(res).toStrictEqual({
                allowedElements: [],
                deniedElements: [],
                notApplicableElements: [element],
                errors: [getNonApplicableError(element)],
            });
        });

        it('should not allow me to move multiple messages from Inbox to Inbox, no error', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());

            const element2 = {
                ID: '2',
                ConversationID: '123',
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
            } as Element;

            const res = result.current.validateMove(MAILBOX_LABEL_IDS.INBOX, [element, element2]);
            expect(res).toStrictEqual({
                allowedElements: [],
                deniedElements: [],
                notApplicableElements: [element, element2],
                errors: [getNonApplicableError(element), getNonApplicableError(element2)],
            });
        });

        it('should not allow to move one sent message from Inbox to spam, show error', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());

            const res = result.current.validateMove(MAILBOX_LABEL_IDS.SPAM, [sentElement]);
            expect(res).toStrictEqual({
                allowedElements: [],
                deniedElements: [sentElement],
                notApplicableElements: [],
                errors: [getDeniedError(sentElement)],
            });
        });

        it('should not allow to move multiple sent messages from Inbox to spam, show error', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());
            const sentElement2 = {
                ...sentElement,
                ID: '2',
                Flags: MESSAGE_FLAGS.FLAG_SENT,
            } as Element;

            const res = result.current.validateMove(MAILBOX_LABEL_IDS.SPAM, [sentElement, sentElement2]);
            expect(res).toStrictEqual({
                allowedElements: [],
                deniedElements: [sentElement, sentElement2],
                notApplicableElements: [],
                errors: [getDeniedError(sentElement), getDeniedError(sentElement2)],
            });
        });

        it('should allow only messages that are not sent to move from inbox to spam', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());
            const sentElement2 = {
                ...sentElement,
                ID: '2',
            } as Element;

            const element3 = {
                ...element,
                ID: '3',
            } as Element;

            const res = result.current.validateMove(MAILBOX_LABEL_IDS.SPAM, [sentElement, sentElement2, element3]);
            expect(res).toStrictEqual({
                allowedElements: [element3],
                deniedElements: [sentElement, sentElement2],
                notApplicableElements: [],
                errors: [getDeniedError(sentElement), getDeniedError(sentElement2)],
            });
        });
    });

    describe('categories tests', () => {
        beforeEach(() => {
            mockUseFolders();
            mockUseLabels();
        });

        it('should allow to move one message from inbox to category', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());

            const res = result.current.validateMove(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, [element]);
            expect(res).toStrictEqual({
                allowedElements: [element],
                deniedElements: [],
                notApplicableElements: [],
                errors: [],
            });
        });

        it('should allow to move one message from one category to another', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());

            const res = result.current.validateMove(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, [newsletterEvent]);
            expect(res).toStrictEqual({
                allowedElements: [newsletterEvent],
                deniedElements: [],
                notApplicableElements: [],
                errors: [],
            });
        });

        it('should not allow to move one message to the same category   ', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());

            const res = result.current.validateMove(MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, [newsletterEvent]);
            expect(res).toStrictEqual({
                allowedElements: [],
                deniedElements: [],
                notApplicableElements: [newsletterEvent],
                errors: [getNonApplicableError(newsletterEvent)],
            });
        });

        it('should only allow messages in different categories to be moved to the a category', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());

            const socialEvent = {
                ...newsletterEvent,
                LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL],
            } as Element;

            const res = result.current.validateMove(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, [newsletterEvent, socialEvent]);
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
            const { result } = renderHook(() => useMessageMoveEngine());

            const res = result.current.validateMove(customFolderID, [element]);
            expect(res).toStrictEqual({
                allowedElements: [element],
                deniedElements: [],
                notApplicableElements: [],
                errors: [],
            });
        });

        it('should allow to move one message from inbox to custom label', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());

            const res = result.current.validateMove(customLabelID, [element]);
            expect(res).toStrictEqual({
                allowedElements: [element],
                deniedElements: [],
                notApplicableElements: [],
                errors: [],
            });
        });

        it('should not allow to move one folder to custom folder if already in the folder', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());
            const customElement = {
                ...element,
                LabelIDs: [customFolderID],
            } as Element;

            const res = result.current.validateMove(customFolderID, [customElement]);
            expect(res).toStrictEqual({
                allowedElements: [],
                deniedElements: [],
                notApplicableElements: [customElement],
                errors: [getNonApplicableError(customElement)],
            });
        });

        it('should not allow to move one label to custom label if already in the label', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());
            const customElement = {
                ...element,
                LabelIDs: [customLabelID],
            } as Element;

            const res = result.current.validateMove(customLabelID, [customElement]);
            expect(res).toStrictEqual({
                allowedElements: [],
                deniedElements: [],
                notApplicableElements: [customElement],
                errors: [getNonApplicableError(customElement)],
            });
        });

        it('should only allow messages in different folders to be moved to the a folder', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());

            const customElement = {
                ...element,
                LabelIDs: [customFolderID],
            } as Element;

            const res = result.current.validateMove(customFolderID, [element, customElement]);
            expect(res).toStrictEqual({
                allowedElements: [element],
                deniedElements: [],
                notApplicableElements: [customElement],
                errors: [getNonApplicableError(customElement)],
            });
        });

        it('should only allow messages in different labels to be moved to the a label', async () => {
            const { result } = renderHook(() => useMessageMoveEngine());

            const customElement = {
                ...element,
                LabelIDs: [customLabelID],
            } as Element;

            const res = result.current.validateMove(customLabelID, [element, customElement]);
            expect(res).toStrictEqual({
                allowedElements: [element],
                deniedElements: [],
                notApplicableElements: [customElement],
                errors: [getNonApplicableError(customElement)],
            });
        });
    });
});
