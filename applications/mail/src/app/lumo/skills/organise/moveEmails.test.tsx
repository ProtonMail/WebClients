import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ActionRequest } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import sentenceText from '@proton/llm/lib/lumoAgent/ui/sentenceText';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { APPLY_LOCATION_TYPES } from '../../../hooks/actions/applyLocation/interface';
import { DefaultFolderReference, buildFixedReferences } from '../../helpers/defaultFolders';
import type { MailToolDeps } from '../../toolModule';
import { buildMailToolDeps } from '../../toolModule.test.helpers';
import { hasEmailSelection, renderEmailSelectionBody } from './emailSelection';
import { createMoveEmailsHandler, moveEmailsCardRenderer, moveEmailsDefinition } from './moveEmails';
import { offListState } from './organise.test.helpers';

describe('moveEmailsDefinition', () => {
    it('refuses a category outside the Inbox before the confirm card', () => {
        const check = () =>
            moveEmailsDefinition.checkParams?.({
                ids: ['email-a1b2c3'],
                folder: DefaultFolderReference.ARCHIVE,
                category: 'promotions',
            });

        expect(check).toThrow(ToolInputError);
        expect(check).toThrow(/only applies with/);
    });

    it.each([
        DefaultFolderReference.SENT,
        DefaultFolderReference.DRAFTS,
        DefaultFolderReference.STARRED,
        DefaultFolderReference.ALL_MAIL,
        DefaultFolderReference.SCHEDULED,
        DefaultFolderReference.SNOOZED,
    ])('refuses %s before the confirm card, naming the allowed destinations', (folder) => {
        const check = () => moveEmailsDefinition.checkParams?.({ ids: ['email-a1b2c3'], folder, category: null });

        expect(check).toThrow(ToolInputError);
        expect(check).toThrow(/folder-inbox, folder-archive, folder-spam, folder-trash/);
    });

    it.each([
        DefaultFolderReference.INBOX,
        DefaultFolderReference.ARCHIVE,
        DefaultFolderReference.SPAM,
        DefaultFolderReference.TRASH,
        'folder-x7b2q1',
    ])('accepts %s as a destination', (folder) => {
        expect(() =>
            moveEmailsDefinition.checkParams?.({ ids: ['email-a1b2c3'], folder, category: null })
        ).not.toThrow();
    });
});

describe('moveEmailsCardRenderer', () => {
    const action: ActionRequest = {
        type: 'move_emails',
        ids: ['email-a1b2c3', 'email-d4e5f6'],
        folder: DefaultFolderReference.TRASH,
    };
    const labels = {
        'email-a1b2c3': { title: 'Booking confirmation' },
        'email-d4e5f6': { title: 'Receipt' },
        [DefaultFolderReference.TRASH]: { title: 'Trash' },
    };

    it('names the destination in the sentence, default folder or the user’s own', () => {
        const folderAction: ActionRequest = {
            type: 'move_emails',
            ids: ['email-a1b2c3'],
            folder: 'folder-x7b2q1',
        };

        expect(sentenceText(moveEmailsCardRenderer.sentence(action, labels))).toContain('Trash');
        expect(
            sentenceText(moveEmailsCardRenderer.sentence(folderAction, { 'folder-x7b2q1': { title: 'Travel' } }))
        ).toContain('Travel');
    });

    // A proposed action is unvalidated, so a destination-less move reaches the card; it must not read
    // "Move 1 email to " with the destination missing.
    it('drops the destination clause when the action names none', () => {
        const unaddressed: ActionRequest = { type: 'move_emails', ids: ['email-a1b2c3'], folder: null };

        expect(sentenceText(moveEmailsCardRenderer.sentence(unaddressed, labels)).trimEnd()).toBe('Move 1 email');
    });

    it('takes the shared selection body and its empty-apply rule', () => {
        expect(moveEmailsCardRenderer.renderBody).toBe(renderEmailSelectionBody);
        expect(moveEmailsCardRenderer.canApply).toBe(hasEmailSelection);
    });

    it('describes the settled move on the result tile', () => {
        expect(moveEmailsCardRenderer.detail?.(action, labels)).toContain('Trash');
    });

    it('names the tab inside the Inbox on the card and the tile', () => {
        const tabAction: ActionRequest = {
            type: 'move_emails',
            ids: ['email-a1b2c3'],
            folder: DefaultFolderReference.INBOX,
            category: 'promotions',
        };
        const inboxLabels = { ...labels, [DefaultFolderReference.INBOX]: { title: 'Inbox' } };

        expect(sentenceText(moveEmailsCardRenderer.sentence(tabAction, inboxLabels))).toContain('Inbox · Promotions');
        expect(moveEmailsCardRenderer.detail?.(tabAction, inboxLabels)).toBe('1 email → Inbox · Promotions');
    });
});

describe('createMoveEmailsHandler', () => {
    it('resolves references to their current elements, on screen or not, and applies a MOVE to the default folder', async () => {
        const references = createReferenceRegistry(buildFixedReferences());
        const emailReference = references.referenceFor('email', 'ELEMENT_ID_1', { title: 'Booking' });
        const element = { ID: 'ELEMENT_ID_1', Subject: 'Booking' };
        const store = { getState: () => offListState([element]) };
        const applyLocation = jest.fn().mockResolvedValue([]);
        const deps = { store, applyLocation } as unknown as MailToolDeps;

        await createMoveEmailsHandler(deps)(
            { ids: [emailReference], folder: DefaultFolderReference.TRASH, category: null },
            { references }
        );

        expect(applyLocation).toHaveBeenCalledWith({
            type: APPLY_LOCATION_TYPES.MOVE,
            elements: [element],
            destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
        });
    });

    it('rejects a hallucinated reference before touching apply-location', async () => {
        const references = createReferenceRegistry(buildFixedReferences());
        const store = { getState: () => ({ elements: { elements: {} } }) };
        const applyLocation = jest.fn();
        const deps = { store, applyLocation } as unknown as MailToolDeps;

        await expect(
            createMoveEmailsHandler(deps)(
                { ids: ['email-zzzzzz'], folder: DefaultFolderReference.TRASH, category: null },
                { references }
            )
        ).rejects.toThrow();
        expect(applyLocation).not.toHaveBeenCalled();
    });

    it('moves mail back to the Inbox', async () => {
        const references = createReferenceRegistry(buildFixedReferences());
        const emailReference = references.referenceFor('email', 'ELEMENT_ID_1', { title: 'Booking' });
        const element = { ID: 'ELEMENT_ID_1', Subject: 'Booking' };
        const store = { getState: () => offListState([element], MAILBOX_LABEL_IDS.ARCHIVE) };
        const applyLocation = jest.fn().mockResolvedValue([]);
        const deps = { store, applyLocation } as unknown as MailToolDeps;

        await createMoveEmailsHandler(deps)(
            { ids: [emailReference], folder: DefaultFolderReference.INBOX, category: null },
            { references }
        );

        expect(applyLocation).toHaveBeenCalledWith({
            type: APPLY_LOCATION_TYPES.MOVE,
            elements: [element],
            destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
        });
    });
});

describe('createMoveEmailsHandler into a category tab', () => {
    const shownIDs: CategoryLabelID[] = [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS];
    const shownTabs: CategoryTab[] = shownIDs.map((id) => ({
        id,
        display: true,
        colorShade: CATEGORIES_COLOR_SHADES.IRIS,
    }));

    const setUp = (labelIDsPerElement: string[][], categoryTabs: CategoryTab[] = shownTabs) => {
        const references = createReferenceRegistry(buildFixedReferences());
        const elements = labelIDsPerElement.map((labelIDs, index) => ({
            ID: `ELEMENT_ID_${index}`,
            Subject: `Subject ${index}`,
            Labels: labelIDs.map((ID) => ({ ID })),
        }));
        const ids = elements.map(({ ID }) => references.referenceFor('email', ID, { title: ID }));
        const applyLocation = jest.fn().mockResolvedValue([]);
        const reportRecategorize = jest.fn();
        const deps = buildMailToolDeps({
            store: { getState: () => offListState(elements) } as unknown as MailToolDeps['store'],
            applyLocation,
            reportRecategorize,
            getActiveCategoryTabs: () => categoryTabs,
        });

        return { references, elements, ids, applyLocation, reportRecategorize, handler: createMoveEmailsHandler(deps) };
    };

    it('moves Inbox emails into the tab and sends one recategorise report from the tab they were in', async () => {
        const { references, elements, ids, applyLocation, reportRecategorize, handler } = setUp([
            [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_SOCIAL],
            [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_DEFAULT],
        ]);

        await handler({ ids, folder: DefaultFolderReference.INBOX, category: 'promotions' }, { references });

        expect(applyLocation).toHaveBeenCalledWith({
            type: APPLY_LOCATION_TYPES.MOVE,
            elements,
            destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
        });
        expect(reportRecategorize).toHaveBeenCalledTimes(1);
        expect(reportRecategorize).toHaveBeenCalledWith(
            MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
            MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
            2
        );
    });

    it('reports an email the server has not categorised as moving from Primary', async () => {
        const { references, ids, reportRecategorize, handler } = setUp([[MAILBOX_LABEL_IDS.INBOX]]);

        await handler({ ids, folder: DefaultFolderReference.INBOX, category: 'promotions' }, { references });

        expect(reportRecategorize).toHaveBeenCalledWith(
            MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
            MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
            1
        );
    });

    it('refuses a selection with any email outside the Inbox, before moving anything', async () => {
        const { references, ids, applyLocation, reportRecategorize, handler } = setUp([
            [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_DEFAULT],
            [MAILBOX_LABEL_IDS.ARCHIVE],
        ]);

        await expect(
            handler({ ids, folder: DefaultFolderReference.INBOX, category: 'promotions' }, { references })
        ).rejects.toThrow(/Move them to the Inbox first/);
        expect(applyLocation).not.toHaveBeenCalled();
        expect(reportRecategorize).not.toHaveBeenCalled();
    });

    it('refuses a category with any destination but the Inbox, before moving anything', async () => {
        const { references, ids, applyLocation, handler } = setUp([[MAILBOX_LABEL_IDS.INBOX]]);

        await expect(
            handler({ ids, folder: DefaultFolderReference.ARCHIVE, category: 'promotions' }, { references })
        ).rejects.toThrow(/only applies with/);
        expect(applyLocation).not.toHaveBeenCalled();
    });

    it('refuses a tab the mailbox does not show, before moving anything', async () => {
        const { references, ids, applyLocation, handler } = setUp([[MAILBOX_LABEL_IDS.INBOX]], []);

        await expect(
            handler({ ids, folder: DefaultFolderReference.INBOX, category: 'promotions' }, { references })
        ).rejects.toThrow(/no "promotions" category tab/);
        expect(applyLocation).not.toHaveBeenCalled();
    });

    it('sends no recategorise report for a move that names no tab', async () => {
        const { references, ids, reportRecategorize, handler } = setUp([[MAILBOX_LABEL_IDS.ARCHIVE]]);

        await handler({ ids, folder: DefaultFolderReference.INBOX, category: null }, { references });

        expect(reportRecategorize).not.toHaveBeenCalled();
    });
});
