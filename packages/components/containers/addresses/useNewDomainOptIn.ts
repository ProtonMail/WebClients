import { useEffect, useState } from 'react';
import { noop } from '@proton/shared/lib/helpers/function';
import { useApi } from '../../hooks';

const useNewDomainOptIn = () => {
    const api = useApi();
    const [domain, setDomain] = useState('');

    useEffect(() => {
        api<{ Domain: string }>({ url: 'domains/optin', method: 'get', silence: true })
            .then(({ Domain }) => {
                setDomain(Domain);
            })
            .catch(noop);
    }, []);

    return domain;
};

export default useNewDomainOptIn;
