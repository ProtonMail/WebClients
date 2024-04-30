import { deleteCustomEmail } from '@proton/pass/lib/monitor/monitor.request';
import { deleteCustomAddress } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: deleteCustomAddress,
    call: async (addressId) => {
        await deleteCustomEmail(addressId);
        return addressId;
    },
});
