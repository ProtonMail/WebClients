import { useMemo } from 'react';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import type { Domain, Organization } from '@proton/shared/lib/interfaces';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';

import shouldShowMail from '../shouldShowMail';
import type { DomainSuggestion } from '../types';
import useGroupsProtonMeDomain from '../useGroupsProtonMeDomain';
import usePmMeDomain from '../usePmMeDomain';

interface UseGroupAvailableAddressDomainsReturn {
    allSuggestions: DomainSuggestion[];
    primarySuggestion: DomainSuggestion;
    pmMeDomain: string | null;
    loading: boolean;
}

const getPrimarySuggestion = (
    showMailFeatures: boolean,
    customDomains: Domain[] | undefined,
    organization: Organization | undefined,
    pmMeDomain: string | null,
    loadingPmMeDomain: boolean,
    groupsProtonMeDomain: string | null,
    loadingGroupsProtonMeDomain: boolean
): DomainSuggestion => {
    if (showMailFeatures && customDomains) {
        const verifiedDomains = customDomains.filter(getIsDomainActive);
        if (verifiedDomains.length > 0) {
            return { domain: verifiedDomains[0].DomainName, source: 'customdomain' };
        }
    }
    if (loadingPmMeDomain || !organization) {
        return { domain: null, source: null };
    }
    if (loadingGroupsProtonMeDomain) {
        return { domain: null, source: null };
    }
    if (groupsProtonMeDomain) {
        return { domain: groupsProtonMeDomain, source: 'group' };
    }
    if (!pmMeDomain) {
        throw new Error('No domain available for groups.');
    }
    const organizationName = organization.DisplayName.toLowerCase().replace(/\s+/g, '');
    return { domain: `${organizationName}${pmMeDomain}`, source: 'pm.me' };
};

const getAllSuggestions = (
    showMailFeatures: boolean,
    customDomains: Domain[] | undefined,
    primarySuggestion: DomainSuggestion,
    pmMeDomain: string | null,
    groupsProtonMeDomain: string | null
): DomainSuggestion[] => {
    const verifiedCustomDomains = showMailFeatures ? (customDomains?.filter(getIsDomainActive) ?? []) : [];
    const result: DomainSuggestion[] = [];

    if (verifiedCustomDomains.length > 0) {
        result.push(...verifiedCustomDomains.map((d) => ({ domain: d.DomainName, source: 'customdomain' as const })));
    } else if (pmMeDomain !== null && primarySuggestion.domain) {
        result.push(primarySuggestion);
    }

    if (groupsProtonMeDomain && !result.some((s) => s.domain === groupsProtonMeDomain)) {
        result.push({ domain: groupsProtonMeDomain, source: 'group' as const });
    }

    return result;
};

const useGroupAvailableAddressDomains = (): UseGroupAvailableAddressDomainsReturn => {
    const [organization] = useOrganization();
    const showMailFeatures = shouldShowMail(organization?.PlanName);
    const [customDomains, loadingCustomDomains] = useCustomDomains();
    const [pmMeDomain, loadingPmMeDomain] = usePmMeDomain();
    const [groupsProtonMeDomain, loadingGroupsProtonMeDomain] = useGroupsProtonMeDomain();

    const primarySuggestion = useMemo(
        () =>
            getPrimarySuggestion(
                showMailFeatures,
                customDomains,
                organization,
                pmMeDomain,
                loadingPmMeDomain,
                groupsProtonMeDomain,
                loadingGroupsProtonMeDomain
            ),
        [
            organization,
            customDomains,
            pmMeDomain,
            loadingPmMeDomain,
            groupsProtonMeDomain,
            loadingGroupsProtonMeDomain,
            showMailFeatures,
        ]
    );

    const allSuggestions = useMemo(
        () => getAllSuggestions(showMailFeatures, customDomains, primarySuggestion, pmMeDomain, groupsProtonMeDomain),
        [primarySuggestion, customDomains, pmMeDomain, groupsProtonMeDomain, showMailFeatures]
    );

    const loading = loadingCustomDomains || loadingPmMeDomain || loadingGroupsProtonMeDomain;

    return { allSuggestions, primarySuggestion, pmMeDomain, loading };
};

export default useGroupAvailableAddressDomains;
