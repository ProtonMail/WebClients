import { select } from 'redux-saga/effects';

import {
    getSecureLink,
    getSecureLinks,
    openSecureLink,
    removeInactiveSecureLinks,
    removeSecureLink,
} from '@proton/pass/lib/items/item.requests';
import {
    itemCreateSecureLink,
    itemGetSecureLinks,
    itemRemoveInactiveSecureLinks,
    itemRemoveSecureLink,
    itemViewSecureLink,
} from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectItem } from '@proton/pass/store/selectors';
import type { ItemRevision, Maybe, SecureLink } from '@proton/pass/types';

const secureLinkCreate = createRequestSaga({
    actions: itemCreateSecureLink,
    call: function* ({ itemId, shareId, ...options }) {
        const item: Maybe<ItemRevision> = yield select(selectItem(shareId, itemId));
        if (!item) throw new Error('Item revision not found');

        const secureLink: SecureLink = yield getSecureLink(item, options);
        return secureLink;
    },
});

const secureLinkRemove = createRequestSaga({
    actions: itemRemoveSecureLink,
    call: async (payload) => {
        await removeSecureLink(payload.linkId);
        return payload;
    },
});

const secureLinkOpen = createRequestSaga({
    actions: itemViewSecureLink,
    call: openSecureLink,
});

const secureLinksGet = createRequestSaga({
    actions: itemGetSecureLinks,
    call: getSecureLinks,
});

const secureLinksRemoveInactive = createRequestSaga({
    actions: itemRemoveInactiveSecureLinks,
    call: async () => {
        await removeInactiveSecureLinks();
        return getSecureLinks();
    },
});

export default [secureLinkCreate, secureLinkRemove, secureLinkOpen, secureLinksGet, secureLinksRemoveInactive];
