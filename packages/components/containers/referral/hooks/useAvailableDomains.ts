import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { Api } from '@proton/shared/lib/interfaces';

import { useApi } from '../../../hooks';

const fetchDomains = async (api: Api) => {
    const result = await api<{ Domains: string[] }>(queryAvailableDomains());

    return result.Domains;
};

const useAvailableDomains = (): [domains: string[], isLoading: boolean] => {
    const [isLoading, withLoading] = useLoading();
    const [domains, setDomains] = useState<string[]>([]);
    const api = useApi();

    useEffect(() => {
        void withLoading(fetchDomains(api))
            .then((fetchedDomains) => {
                setDomains(Array.isArray(fetchedDomains) ? fetchedDomains : []);
            })
            .catch(() => {
                setDomains([]);
            });
    }, [api]);

    return [domains, isLoading];
};

export default useAvailableDomains;
