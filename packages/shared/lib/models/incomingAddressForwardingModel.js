import { queryAllIncomingForwardings } from '../api/forwardings';
import updateCollection from '../helpers/updateCollection';

export const IncomingAddressForwardingModel = {
    key: 'IncomingAddressForwardings',
    get: queryAllIncomingForwardings,
    update: (model, events) => updateCollection({ model, events, itemKey: 'IncomingAddressForwarding' }),
};
