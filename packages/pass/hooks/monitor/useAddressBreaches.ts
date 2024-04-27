import { useEffect, useMemo } from 'react';

import type { FetchedBreaches } from '@proton/components/containers';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { type AddressBreachDTO, AddressType } from '@proton/pass/lib/monitor/types';
import { getAliasBreach, getCustomBreach, getProtonBreach } from '@proton/pass/store/actions';
import { aliasBreachRequest, customBreachRequest, protonBreachRequest } from '@proton/pass/store/actions/requests';
import type { LoginItem } from '@proton/pass/types';
import { partition } from '@proton/pass/utils/array/partition';

const getRequest = (dto: AddressBreachDTO) => {
    switch (dto.type) {
        case AddressType.PROTON:
            return [getProtonBreach, protonBreachRequest(dto.addressId)] as const;
        case AddressType.ALIAS:
            return [getAliasBreach, aliasBreachRequest(dto.shareId, dto.itemId)] as const;
        case AddressType.CUSTOM:
            return [getCustomBreach, customBreachRequest(dto.addressId)] as const;
    }
};

export type BreachDetails = {
    loading: boolean;
    resolved: FetchedBreaches[];
    active: FetchedBreaches[];
    usedIn: LoginItem[];
};

export const useAddressBreaches = <T extends AddressType>(dto: AddressBreachDTO<T>) => {
    const [request, initialRequestId] = getRequest(dto);
    const req = useRequest(request, { initialRequestId });

    useEffect(() => {
        switch (dto.type) {
            case AddressType.PROTON:
                return req.dispatch(dto.addressId);
            case AddressType.ALIAS:
                return req.dispatch({ shareId: dto.shareId, itemId: dto.itemId });
            case AddressType.CUSTOM:
                return req.dispatch(dto.addressId);
        }
    }, []);

    return useMemo<BreachDetails>(() => {
        const [active, resolved] = partition(req.data ?? [], ({ resolvedState }) => resolvedState < 3);
        return { loading: req.loading, active, resolved, usedIn: [] };
    }, [req]);
};
