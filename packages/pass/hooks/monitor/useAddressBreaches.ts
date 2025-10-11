import { useEffect, useMemo, useState } from 'react';

import type { FetchedBreaches } from '@proton/components/containers/credentialLeak/models';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { type AddressBreachDTO, AddressType } from '@proton/pass/lib/monitor/types';
import { getAliasBreach, getCustomBreach, getProtonBreach } from '@proton/pass/store/actions';
import { selectItemsByUserIdentifier } from '@proton/pass/store/selectors';
import type { LoginItem } from '@proton/pass/types';
import { partition } from '@proton/pass/utils/array/partition';

const getRequest = (dto: AddressBreachDTO) => {
    switch (dto.type) {
        case AddressType.PROTON:
            return [getProtonBreach, dto.addressId] as const;
        case AddressType.ALIAS:
            return [getAliasBreach, dto] as const;
        case AddressType.CUSTOM:
            return [getCustomBreach, dto.addressId] as const;
    }
};

export type BreachDetails = {
    loading: boolean;
    resolved: FetchedBreaches[];
    active: FetchedBreaches[];
    usages: LoginItem[];
};

export const useAddressBreaches = <T extends AddressType>(dto: AddressBreachDTO<T>, email: string) => {
    const [request, initial] = getRequest(dto);
    const [breaches, setBreaches] = useState<FetchedBreaches[]>([]);
    const req = useRequest(request, { initial, onSuccess: setBreaches });
    const usages = useMemoSelector(selectItemsByUserIdentifier, [email]);

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
        const data = req.loading ? [] : breaches;
        const [active, resolved] = partition(data, ({ resolvedState }) => resolvedState < 3);
        return { loading: req.loading, active, resolved, usages };
    }, [req, breaches, usages]);
};
