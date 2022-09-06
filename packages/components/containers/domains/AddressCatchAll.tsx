import { c } from 'ttag';

import { updateCatchAll } from '@proton/shared/lib/api/domains';
import { ADDRESS_STATUS, RECEIVE_ADDRESS } from '@proton/shared/lib/constants';
import { Domain, DomainAddress } from '@proton/shared/lib/interfaces';

import { Radio } from '../../components';
import { useApiWithoutResult, useNotifications } from '../../hooks';

interface Props {
    address: DomainAddress;
    domain: Domain;
    onChange: (ID: string, value: boolean) => void;
}

const AddressCatchAll = ({ address, domain, onChange }: Props) => {
    const { request, loading } = useApiWithoutResult(updateCatchAll);
    const { createNotification } = useNotifications();
    const { Status, Receive } = address;

    const isAddressActive = Status === ADDRESS_STATUS.STATUS_ENABLED && Receive === RECEIVE_ADDRESS.RECEIVE_YES;

    return (
        <Radio
            name="catchAllRadioGroup"
            id={address.ID}
            disabled={loading || !isAddressActive}
            checked={!!address.CatchAll}
            onChange={async ({ target }) => {
                const newValue = target.checked;
                await request(domain.ID, newValue ? address.ID : null);
                onChange(address.ID, newValue);
                createNotification({ text: c('Success').t`Catch-all address updated` });
            }}
        />
    );
};

export default AddressCatchAll;
