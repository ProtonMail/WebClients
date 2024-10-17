import {
    aliasBlockContactApi,
    aliasDeleteContactApi,
    aliasFetchContactInfoApi,
} from '@proton/pass/lib/alias/alias.requests';
import { aliasBlockContact, aliasDeleteContact, aliasFetchContactInfo } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

const aliasContactInfoSaga = createRequestSaga({
    actions: aliasFetchContactInfo,
    call: aliasFetchContactInfoApi,
});

const aliasDeleteContactSaga = createRequestSaga({
    actions: aliasDeleteContact,
    call: aliasDeleteContactApi,
});

const blockAliasContactSaga = createRequestSaga({
    actions: aliasBlockContact,
    call: aliasBlockContactApi,
});

export default [aliasContactInfoSaga, aliasDeleteContactSaga, blockAliasContactSaga];
