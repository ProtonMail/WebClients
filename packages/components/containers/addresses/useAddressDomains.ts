import { useEffect, useState } from 'react';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { Member } from '@proton/shared/lib/interfaces';
import { MEMBER_TYPE } from '@proton/shared/lib/constants';

import { useApi, useDomains, useLoading, usePremiumDomains, useUser } from '../../hooks';

const useAddressDomains = (member: Member) => {
    const api = useApi();
    const [user] = useUser();
    const [customDomains, loadingDomains] = useDomains();
    const [premiumProtonDomains, loadingPremiumDomains] = usePremiumDomains();
    const [loading, withLoading] = useLoading(true);

    const [protonDomains, setProtonDomains] = useState<string[]>([]);

    const hasProtonDomains = member.Type === MEMBER_TYPE.PROTON;

    useEffect(() => {
        const queryDomains = async () => {
            const available = hasProtonDomains
                ? await api<{ Domains: string[] }>(queryAvailableDomains()).then(({ Domains }) => Domains)
                : [];
            setProtonDomains(available);
        };
        withLoading(queryDomains());
    }, []);

    const allDomains = [
        ...protonDomains,
        ...(Array.isArray(customDomains) ? customDomains.map(({ DomainName }) => DomainName) : []),
        ...(hasProtonDomains && user.hasPaidMail && Array.isArray(premiumProtonDomains) ? premiumProtonDomains : []),
    ];

    return [allDomains, loading || loadingDomains || loadingPremiumDomains] as const;
};

export default useAddressDomains;
