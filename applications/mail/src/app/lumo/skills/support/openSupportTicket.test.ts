import { getMailBugCategoryValues } from '@proton/components/containers/support/bugCategories';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';

import { createOpenSupportTicketHandler, openSupportTicketDefinition, toBugModalPrefill } from './openSupportTicket';

const anyContext = {} as any;

describe('toBugModalPrefill', () => {
    it('passes a guessed category through', () => {
        expect(toBugModalPrefill({ description: 'Unread count is wrong', category: 'Mail problem' })).toEqual({
            description: 'Unread count is wrong',
            category: 'Mail problem',
        });
    });

    it('drops a null category so the form keeps its own default', () => {
        expect(toBugModalPrefill({ description: 'Unread count is wrong', category: null })).toEqual({
            description: 'Unread count is wrong',
            category: undefined,
        });
    });
});

describe('createOpenSupportTicketHandler', () => {
    it('posts the prefilled bug-modal event to this window at its own origin', async () => {
        const postMessage = jest.spyOn(window, 'postMessage').mockImplementation(() => {});

        await createOpenSupportTicketHandler()({ description: 'Unread count is wrong', category: null }, anyContext);

        expect(postMessage).toHaveBeenCalledWith(
            {
                type: DRAWER_EVENTS.OPEN_BUG_MODAL,
                payload: { description: 'Unread count is wrong', category: undefined },
            },
            window.location.origin
        );

        postMessage.mockRestore();
    });
});

describe('openSupportTicketDefinition', () => {
    // Pulled from the form's own option list rather than copied, so a category added or renamed in
    // BugModal reaches the model without this file being touched.
    it("offers the form's own categories as the schema enum", () => {
        expect(openSupportTicketDefinition.paramsSchema.properties.category.enum).toEqual([
            ...getMailBugCategoryValues(),
            null,
        ]);
    });

    // A list in the description reads to the model as a menu: it recited all 22 to the user and asked
    // which one fitted. The values belong in the enum, and the prose must not grow a copy of them.
    it('keeps the category values out of the model-facing prose', () => {
        getMailBugCategoryValues().forEach((value) => {
            expect(openSupportTicketDefinition.toolDescription).not.toContain(value);
        });
    });

    // Both params carry user prose, and the engine's hallucination guard rejects any string shaped like a
    // reference — so an ordinary description ("e-ticket never arrived") would never reach the handler.
    it('exempts both params from the reference guard, leaving nothing guarded', () => {
        const guarded = Object.keys(openSupportTicketDefinition.paramsSchema.properties).filter(
            (param) => !openSupportTicketDefinition.freeTextParams?.includes(param)
        );

        expect(guarded).toEqual([]);
    });
});
