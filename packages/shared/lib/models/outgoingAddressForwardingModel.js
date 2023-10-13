import { queryAllOutgoingForwardings } from '../api/forwardings';
import updateCollection from '../helpers/updateCollection';

export const OutgoingAddressForwardingModel = {
    key: 'OutgoingAddressForwardings',
    get: queryAllOutgoingForwardings,
    update: (model, events) => updateCollection({ model, events, itemKey: 'OutgoingAddressForwarding' }),
};
