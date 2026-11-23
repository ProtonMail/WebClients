import { contactEmailsReducer, selectContactEmails } from '@proton/account/contactEmails';
import { getModelState } from '@proton/account/testing/getModelState';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';
import { ActionEventV6, type MailEventV6Response } from '@proton/shared/lib/api/events';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { Category } from '@proton/shared/lib/interfaces/Category';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';

import { categoriesEventLoopV6Thunk, categoriesReducer } from './index';

describe('categoriesEventLoopV6Thunk', () => {
    it('removes a deleted contact group from contact emails', async () => {
        const { store } = getTestStore({
            reducer: { ...categoriesReducer, ...contactEmailsReducer },
            preloadedState: {
                categories: getModelState([{ ID: 'deleted' }, { ID: 'kept' }] as Category[]),
                contactEmails: getModelState([{ ID: '1', LabelIDs: ['deleted', 'kept'] }] as ContactEmail[]),
            },
            extraThunkArguments: {} as ProtonThunkArguments,
        });
        const event = { Labels: [{ ID: 'deleted', Action: ActionEventV6.Delete }] } as MailEventV6Response;

        await store.dispatch(categoriesEventLoopV6Thunk({ event, api: vi.fn() as unknown as Api }));

        expect(selectContactEmails(store.getState()).value![0].LabelIDs).toEqual(['kept']);
    });
});
