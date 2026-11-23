import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { Category } from '@proton/shared/lib/interfaces/Category';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';

import { getServerEvent } from '../tests/getServerEvent';
import { contactEmailsReducer, contactEmailsThunk, selectContactEmails } from './index';

const contactEmail = (ID: string, LabelIDs: string[]) => ({ ID, LabelIDs, Order: 1 }) as ContactEmail;

const setup = async (contactEmails: ContactEmail[]) => {
    const extraThunkArguments = {
        api: async () => ({ ContactEmails: contactEmails, Total: contactEmails.length }),
    } as unknown as ProtonThunkArguments;
    const { store } = getTestStore({ reducer: { ...contactEmailsReducer }, extraThunkArguments });
    await store.dispatch(contactEmailsThunk());
    return store;
};

describe('contactEmails', () => {
    it('removes a deleted group from the contact emails that belong to it', async () => {
        const untouched = contactEmail('2', ['kept']);
        const store = await setup([contactEmail('1', ['deleted', 'kept']), untouched]);

        store.dispatch(getServerEvent({ Labels: [{ ID: 'deleted', Action: EVENT_ACTIONS.DELETE }] }));

        const [first, second] = selectContactEmails(store.getState()).value!;
        expect(first.LabelIDs).toEqual(['kept']);
        expect(second).toBe(untouched);
    });

    it('keeps group ids when a label is created or updated', async () => {
        const store = await setup([contactEmail('1', ['group'])]);

        store.dispatch(
            getServerEvent({
                Labels: [{ ID: 'group', Action: EVENT_ACTIONS.UPDATE, Label: { ID: 'group' } as Category }],
            })
        );

        expect(selectContactEmails(store.getState()).value![0].LabelIDs).toEqual(['group']);
    });
});
