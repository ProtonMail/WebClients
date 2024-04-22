import { useEffect, useMemo } from 'react';

import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { AddressType } from '@proton/pass/lib/monitor/types';
import { getAliasBreach, getCustomBreach, getProtonBreach } from '@proton/pass/store/actions';
import { aliasBreachRequest, customBreachRequest, protonBreachRequest } from '@proton/pass/store/actions/requests';
import type { SelectedItem } from '@proton/pass/types';

type AddressBreach =
    | { type: AddressType.PROTON; addressId: string }
    | { type: AddressType.CUSTOM; addressId: string }
    | ({ type: AddressType.ALIAS } & SelectedItem);

const getAddressBreach = ({ type }: AddressBreach) => {
    switch (type) {
        case AddressType.PROTON:
            return getProtonBreach;
        case AddressType.ALIAS:
            return getAliasBreach;
        case AddressType.CUSTOM:
            return getCustomBreach;
    }
};

const addressBreachRequestId = (options: AddressBreach) => {
    switch (options.type) {
        case AddressType.PROTON:
            return protonBreachRequest(options.addressId);
        case AddressType.ALIAS:
            return aliasBreachRequest(options.shareId, options.itemId);
        case AddressType.CUSTOM:
            return customBreachRequest(options.addressId);
    }
};

export const useAddressBreaches = (options: AddressBreach) => {
    const { data, loading, dispatch } = useRequest(getAddressBreach(options), {
        initialRequestId: addressBreachRequestId(options),
    });

    useEffect(() => {
        switch (options.type) {
            case AddressType.PROTON:
                dispatch(options.addressId);
                break;
            case AddressType.ALIAS:
                dispatch(options);
                break;
            case AddressType.CUSTOM:
                dispatch(options.addressId);
                break;
        }
    }, []);

    return useMemo(() => ({ data, loading }), [data, loading]);
};
