import { select } from 'redux-saga/effects';

import {
    createSecureLink,
    getSecureLinks,
    openSecureLink,
    removeInactiveSecureLinks,
    removeSecureLink,
} from '@proton/pass/lib/secure-links/secure-links.requests';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/utils';
import { secureLinkCreate, secureLinkOpen, secureLinkRemove, secureLinksGet, secureLinksRemoveInactive } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectItem } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision, Maybe, SecureLink } from '@proton/pass/types';
import { TelemetryEventName, TelemetryItemType, TelemetryTargetType } from '@proton/pass/types/data/telemetry';

const open = createRequestSaga({ actions: secureLinkOpen, call: openSecureLink });

const get = createRequestSaga({ actions: secureLinksGet, call: getSecureLinks });

const create = createRequestSaga({
    actions: secureLinkCreate,
    call: function* ({ itemId, shareId, ...options }, { getTelemetry }: RootSagaOptions) {
        const item: Maybe<ItemRevision> = yield select(selectItem(shareId, itemId));
        if (!item) throw new Error('Item revision not found');

        const secureLink: SecureLink = yield createSecureLink(item, options);

        const telemetry = getTelemetry();
        void telemetry?.push(
            createTelemetryEvent(
                TelemetryEventName.PassSecureLinkCreate,
                {},
                { type: TelemetryTargetType.item, itemType: TelemetryItemType[item.data.type], extensionBrowser: BUILD_TARGET }
            )
        );
        return secureLink;
    },
});

const remove = createRequestSaga({
    actions: secureLinkRemove,
    call: function* (payload, { getTelemetry }: RootSagaOptions) {
        yield removeSecureLink(payload.linkId);

        const telemetry = getTelemetry();
        const item: Maybe<ItemRevision> = yield select(selectItem(payload.shareId, payload.itemId));
        if (item) {
            void telemetry?.push(
                createTelemetryEvent(
                    TelemetryEventName.PassSecureLinkDelete,
                    {},
                    { type: TelemetryTargetType.item, itemType: TelemetryItemType[item.data.type], extensionBrowser: BUILD_TARGET }
                )
            );
        }
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
