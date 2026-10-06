import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { SOURCE_ACTION } from '../../../components/list/list-telemetry/useListTelemetry';
import type { MailToolDeps } from '../../toolModule';
import { emailCountDetail, hasEmailSelection, renderEmailSelectionBody } from './emailSelection';
import { conversationIn, offListState } from './organise.test.helpers';
import { createSetReadHandler, setReadCardRenderer, setReadDefinition } from './setRead';

describe('setReadDefinition', () => {
    // Without this, a whole-folder request is proposed as a set_read over the handful of rows on screen,
    // which silently under-delivers rather than failing.
    it('sends the model to set_location_read for a whole folder', () => {
        expect(setReadDefinition.toolDescription).toContain('use set_location_read');
    });
});

describe('setReadCardRenderer', () => {
    it('takes the shared selection body, its empty-apply rule and the shared count detail', () => {
        expect(setReadCardRenderer.renderBody).toBe(renderEmailSelectionBody);
        expect(setReadCardRenderer.canApply).toBe(hasEmailSelection);
        expect(setReadCardRenderer.detail).toBe(emailCountDetail);
    });
});

describe('createSetReadHandler', () => {
    const setUp = (conversations = [conversationIn(MAILBOX_LABEL_IDS.INBOX)]) => {
        const references = createReferenceRegistry();
        const emailReferences = conversations.map((conversation) =>
            references.referenceFor('email', conversation.ID, { title: 'Booking' })
        );
        const state = offListState(conversations);
        const markAs = jest.fn().mockResolvedValue(undefined);
        const deps = { store: { getState: () => state }, markAs, getFolders: () => [] } as unknown as MailToolDeps;

        return { references, emailReferences, conversations, markAs, deps };
    };

    const markCall = (elements: unknown[], status: MARK_AS_STATUS, labelID: string) => {
        return { elements, status, silent: true, labelID, sourceAction: SOURCE_ACTION.TOOLBAR };
    };

    it.each([
        ['read', true, MARK_AS_STATUS.READ],
        ['unread', false, MARK_AS_STATUS.UNREAD],
    ])(
        'resolves references to their current elements and marks them %s without toggling',
        async (_name, read, status) => {
            const { references, emailReferences, conversations, markAs, deps } = setUp();

            await createSetReadHandler(deps)({ ids: emailReferences, read }, { references });

            expect(markAs).toHaveBeenCalledWith(markCall(conversations, status, MAILBOX_LABEL_IDS.INBOX));
        }
    );

    // The server marks a conversation unread within the label it is given, so the view's label would leave
    // a conversation that is not in it untouched.
    it('marks an email from outside the current view in the folder it sits in', async () => {
        const archived = conversationIn(MAILBOX_LABEL_IDS.ARCHIVE);
        const { references, emailReferences, markAs, deps } = setUp([archived]);

        await createSetReadHandler(deps)({ ids: emailReferences, read: false }, { references });

        expect(markAs).toHaveBeenCalledTimes(1);
        expect(markAs).toHaveBeenCalledWith(markCall([archived], MARK_AS_STATUS.UNREAD, MAILBOX_LABEL_IDS.ARCHIVE));
    });

    it('marks a selection spanning the view and another folder once per label', async () => {
        const inbox = conversationIn(MAILBOX_LABEL_IDS.INBOX);
        const archived = conversationIn(MAILBOX_LABEL_IDS.ARCHIVE, 'ELEMENT_ID_2');
        const { references, emailReferences, markAs, deps } = setUp([inbox, archived]);

        await createSetReadHandler(deps)({ ids: emailReferences, read: false }, { references });

        expect(markAs).toHaveBeenCalledTimes(2);
        expect(markAs).toHaveBeenCalledWith(markCall([inbox], MARK_AS_STATUS.UNREAD, MAILBOX_LABEL_IDS.INBOX));
        expect(markAs).toHaveBeenCalledWith(markCall([archived], MARK_AS_STATUS.UNREAD, MAILBOX_LABEL_IDS.ARCHIVE));
    });

    // `useMarkAs` resolves cleanly on an empty selection, so the engine would feed back a success the model
    // then relays to the user.
    it('rejects an empty selection rather than reporting a mark that never ran', async () => {
        const { references, markAs, deps } = setUp();

        await expect(createSetReadHandler(deps)({ ids: [], read: true }, { references })).rejects.toThrow(
            /at least one email-…/
        );
        expect(markAs).not.toHaveBeenCalled();
    });

    it('rejects a hallucinated reference before touching mark-as', async () => {
        const { markAs, deps } = setUp();
        const references = createReferenceRegistry();

        await expect(
            createSetReadHandler(deps)({ ids: ['email-zzzzzz'], read: true }, { references })
        ).rejects.toThrow();
        expect(markAs).not.toHaveBeenCalled();
    });
});
