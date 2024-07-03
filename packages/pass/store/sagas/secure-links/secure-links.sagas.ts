import { select } from 'redux-saga/effects';

import {
    createSecureLink,
    getSecureLinks,
    openSecureLink,
    removeInactiveSecureLinks,
    removeSecureLink,
} from '@proton/pass/lib/secure-links/secure-links.requests';
import {
    secureLinkCreate,
    secureLinkOpen,
    secureLinkRemove,
    secureLinksGet,
    secureLinksRemoveInactive,
} from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectItem } from '@proton/pass/store/selectors';
import type { ItemRevision, Maybe, SecureLink } from '@proton/pass/types';

const open = createRequestSaga({ actions: secureLinkOpen, call: openSecureLink });

const get = createRequestSaga({ actions: secureLinksGet, call: getSecureLinks });

const create = createRequestSaga({
    actions: secureLinkCreate,
    call: function* ({ itemId, shareId, ...options }) {
        const item: Maybe<ItemRevision> = yield select(selectItem(shareId, itemId));
        if (!item) throw new Error('Item revision not found');

        const secureLink: SecureLink = yield createSecureLink(item, options);
        return secureLink;
    },
});

const remove = createRequestSaga({
    actions: secureLinkRemove,
    call: async (payload) => {
        await removeSecureLink(payload.linkId);
        return payload;
    },
});

const removeInactive = createRequestSaga({
    actions: secureLinksRemoveInactive,
    call: async () => {
        await removeInactiveSecureLinks();
        return getSecureLinks();
    },
});

export default [create, remove, open, get, removeInactive];
