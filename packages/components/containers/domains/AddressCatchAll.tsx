import { c } from 'ttag';

import { updateCatchAll } from '@proton/shared/lib/api/domains';
import { Domain, DomainAddress } from '@proton/shared/lib/interfaces';

import { Checkbox } from '../../components';
import { useApiWithoutResult, useNotifications } from '../../hooks';

interface Props {
    address: DomainAddress;
    domain: Domain;
    onChange: (ID: string, value: boolean) => void;
    disabled: boolean;
}

const AddressCatchAll = ({ address, domain, onChange, disabled }: Props) => {
    const { request, loading } = useApiWithoutResult(updateCatchAll);
    const { createNotification } = useNotifications();

    return (
        <Checkbox
            id={address.ID}
            disabled={loading || disabled}
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
