import { useState, useEffect } from 'react';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { Member } from '@proton/shared/lib/interfaces';

import { useApi, useLoading, useUser, useDomains, usePremiumDomains } from '../../hooks';

const useAddressDomains = (member: Member) => {
    const api = useApi();
    const [user] = useUser();
    const [domains, loadingDomains] = useDomains();
    const [premiumDomains, loadingPremiumDomains] = usePremiumDomains();
    const [loading, withLoading] = useLoading(true);

    const [selfAvailable, setSelfDomains] = useState<string[]>([]);

    useEffect(() => {
        const queryDomains = async () => {
            const available =
                member.Self && member.Subscriber
                    ? await api<{ Domains: string[] }>(queryAvailableDomains()).then(({ Domains }) => Domains)
                    : [];
            setSelfDomains(available);
        };
        withLoading(queryDomains());
    }, [member, domains, premiumDomains]);

    const allDomains = [
        ...(member.Self && member.Subscriber ? selfAvailable : []),
        ...(Array.isArray(domains) ? domains.map(({ DomainName }) => DomainName) : []),
        ...(member.Self && member.Subscriber && user.hasPaidMail && Array.isArray(premiumDomains)
            ? premiumDomains
            : []),
    ];

    return [allDomains, loading || loadingDomains || loadingPremiumDomains] as const;
};

export default useAddressDomains;
