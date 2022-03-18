import { useEffect, useState } from 'react';
import { noop } from '@proton/shared/lib/helpers/function';
import { useApi } from '../../hooks';

const useNewDomainOptIn = () => {
    const api = useApi();
    const state = useState('');
    const [, setDomain] = state;

    useEffect(() => {
        api<{ Domain: string }>({ url: 'domains/optin', method: 'get', silence: true })
            .then(({ Domain }) => {
                setDomain(Domain);
            })
            .catch(noop);
    }, []);

    return state;
};

export default useNewDomainOptIn;
