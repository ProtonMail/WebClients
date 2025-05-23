import { c } from 'ttag';

import Checkbox from '@proton/components/components/input/Checkbox';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { updateCatchAll } from '@proton/shared/lib/api/domains';
import type { Domain, DomainAddress } from '@proton/shared/lib/interfaces';

interface Props {
    address: DomainAddress;
    domain: Domain;
    onChange: (ID: string, value: boolean) => void;
    disabled: boolean;
}

const AddressCatchAll = ({ address, domain, onChange, disabled }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const update = async (newValue: boolean) => {
        await api(updateCatchAll(domain.ID, newValue ? address.ID : null));
        onChange(address.ID, newValue);
        createNotification({ text: c('Success').t`Catch-all address updated` });
    };

    return (
        <Checkbox
            id={address.ID}
            disabled={loading || disabled}
            checked={!!address.CatchAll}
            onChange={async ({ target }) => {
                withLoading(update(target.checked));
            }}
        />
    );
};

export default AddressCatchAll;
