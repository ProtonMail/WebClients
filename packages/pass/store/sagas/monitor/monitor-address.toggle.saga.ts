import { put, select } from 'redux-saga/effects';

import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { updateItemFlags } from '@proton/pass/lib/items/item.requests';
import { toggleCustomEmail, toggleProtonEmail } from '@proton/pass/lib/monitor/monitor.request';
import { intoAliasMonitorAddress, intoCustomMonitorAddress } from '@proton/pass/lib/monitor/monitor.utils';
import { AddressType, type MonitorAddress } from '@proton/pass/lib/monitor/types';
import { getBreaches, itemEditSync, toggleAddressMonitor } from '@proton/pass/store/actions';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectProtonBreaches } from '@proton/pass/store/selectors';
import type { BreachCustomEmailGetResponse, ItemRevision, ItemRevisionContentsResponse } from '@proton/pass/types';
import { partialMerge } from '@proton/pass/utils/object/merge';

export default createRequestSaga({
    actions: toggleAddressMonitor,
    call: function* ({ monitor: Monitor, ...dto }) {
        switch (dto.type) {
            case AddressType.ALIAS: {
                const { shareId, itemId } = dto;
                const data = { SkipHealthCheck: !Monitor };
                const encryptedItem: ItemRevisionContentsResponse = yield updateItemFlags(shareId, itemId, data);
                const item: ItemRevision<'alias'> = yield parseItemRevision(shareId, encryptedItem);
                yield put(itemEditSync({ item, shareId, itemId }));
                yield put(withRevalidate(getBreaches.intent()));
                return intoAliasMonitorAddress(item);
            }

            case AddressType.CUSTOM: {
                const { addressId } = dto;
                const response: BreachCustomEmailGetResponse = yield toggleCustomEmail(addressId, { Monitor });
                yield put(withRevalidate(getBreaches.intent()));
                return intoCustomMonitorAddress(response);
            }

            case AddressType.PROTON: {
                const { addressId } = dto;
                const addresses: MonitorAddress<AddressType.PROTON>[] = (yield select(selectProtonBreaches)) ?? [];
                const current = addresses.find((address) => address.addressId === addressId);
                if (!current) throw new Error('Unknown proton address');
                yield toggleProtonEmail(addressId, { Monitor });
                yield put(withRevalidate(getBreaches.intent()));
                return partialMerge(current, { monitored: Monitor });
            }
        }
    },
});
