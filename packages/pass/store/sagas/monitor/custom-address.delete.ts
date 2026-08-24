import { deleteCustomEmail } from '../../../lib/monitor/monitor.request';
import { deleteCustomAddress } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({
    actions: deleteCustomAddress,
    call: async (addressId) => {
        await deleteCustomEmail(addressId);
        return addressId;
    },
});
