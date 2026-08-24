import {
    aliasBlockContactApi,
    aliasCreateContactApi,
    aliasDeleteContactApi,
    aliasGetContactInfoApi,
    aliasGetContactsListApi,
} from '../../../lib/alias/alias.requests';
import { aliasBlockContact, aliasCreateContact, aliasDeleteContact, aliasGetContactInfo, aliasGetContactsList } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

const aliasContactListSaga = createRequestSaga({
    actions: aliasGetContactsList,
    call: aliasGetContactsListApi,
});

const aliasContactInfoSaga = createRequestSaga({
    actions: aliasGetContactInfo,
    call: aliasGetContactInfoApi,
});

const aliasCreateContactSaga = createRequestSaga({
    actions: aliasCreateContact,
    call: aliasCreateContactApi,
});

const aliasDeleteContactSaga = createRequestSaga({
    actions: aliasDeleteContact,
    call: aliasDeleteContactApi,
});

const blockAliasContactSaga = createRequestSaga({
    actions: aliasBlockContact,
    call: aliasBlockContactApi,
});

export default [aliasContactListSaga, aliasContactInfoSaga, aliasCreateContactSaga, aliasDeleteContactSaga, blockAliasContactSaga];
