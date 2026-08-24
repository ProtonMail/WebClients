import { put, select } from 'redux-saga/effects';

import { parseItemRevision } from '../../../lib/items/item.parser';
import { updateItemFlags } from '../../../lib/items/item.requests';
import { toggleCustomEmail, toggleProtonEmail } from '../../../lib/monitor/monitor.request';
import { intoAliasMonitorAddress, intoCustomMonitorAddress } from '../../../lib/monitor/monitor.utils';
import { AddressType, type MonitorAddress } from '../../../lib/monitor/types';
import type { BreachCustomEmailGetResponse, ItemRevision, ItemRevisionContentsResponse } from '../../../types';
import { partialMerge } from '../../../utils/object/merge';
import { getBreaches, itemsUpdated, toggleAddressMonitor } from '../../actions';
import { withRevalidate } from '../../request/enhancers';
import { createRequestSaga } from '../../request/sagas';
import { selectProtonBreaches } from '../../selectors';

export default createRequestSaga({
    actions: toggleAddressMonitor,
    call: function* ({ monitor: Monitor, ...dto }) {
        switch (dto.type) {
            case AddressType.ALIAS: {
                const { shareId, itemId } = dto;
                const data = { SkipHealthCheck: !Monitor };
                const encryptedItem: ItemRevisionContentsResponse = yield updateItemFlags(shareId, itemId, data);
                const item: ItemRevision<'alias'> = yield parseItemRevision(shareId, encryptedItem);
                yield put(itemsUpdated([item]));
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
