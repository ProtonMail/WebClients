import type { Action, ThunkDispatch } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { type DomainAddressesState, domainAddressesThunk } from '@proton/account/domainsAddresses';
import Checkbox from '@proton/components/components/input/Checkbox';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { baseUseDispatch } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { updateCatchAll } from '@proton/shared/lib/api/domains';
import type { Domain, DomainAddress } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

interface Props {
    address: DomainAddress;
    domain: Domain;
    onChange: (ID: string, value: boolean) => void;
    disabled: boolean;
}

const AddressCatchAll = ({ address, domain, onChange, disabled }: Props) => {
    const api = useApi();
    const dispatch = baseUseDispatch<ThunkDispatch<DomainAddressesState, ProtonThunkArguments, Action>>();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const update = async (newValue: boolean) => {
        await api(updateCatchAll(domain.ID, newValue ? address.ID : null));
        dispatch(domainAddressesThunk({ domainID: domain.ID, cache: CacheType.None })).catch(noop);
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
