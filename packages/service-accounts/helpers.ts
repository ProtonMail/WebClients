import { removeDiacritics } from '@proton/shared/lib/helpers/string';
import type { Domain } from '@proton/shared/lib/interfaces/Domain';
import type { ServiceAccount, ServiceAccountManager } from '@proton/shared/lib/interfaces/ServiceAccount';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';

export interface ServiceAccountManagerOption {
    MemberID: string;
    Name: string;
    Email: string;
}

export const getManagerChanges = (current: ServiceAccountManager[], selected: ServiceAccountManagerOption[]) => {
    const currentIDs = new Set(current.map(({ MemberID }) => MemberID));
    const selectedIDs = new Set(selected.map(({ MemberID }) => MemberID));
    return {
        added: selected.filter(({ MemberID }) => !currentIDs.has(MemberID)),
        removed: current.filter(({ MemberID }) => !selectedIDs.has(MemberID)),
    };
};

/**
 * Turn a name into a valid address local part: lowercase Latin letters and digits, joined by single separators.
 * From `number` 2, the number follows the name (`ci-bot2`), for when the plain address is taken.
 */
export const getServiceAccountEmailLocal = (name: string, number = 1) => {
    const local =
        removeDiacritics(name.trim())
            .toLowerCase()
            .replace(/[^a-z0-9._-]+/g, '-')
            // Consecutive separators (`a..b`) make an invalid address.
            .replace(/[._-]{2,}/g, (separators) => (separators.includes('.') ? '.' : separators[0]))
            .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '') || 'service-account';
    const suffix = number > 1 ? `${number}` : '';
    return `${local.slice(0, 40 - suffix.length).replace(/[^a-z0-9]+$/g, '')}${suffix}`;
};

/** Service accounts get an address on the first active custom domain: the API does not accept Proton domains. */
export const getServiceAccountDomain = (domains: Domain[] | undefined) => domains?.find(getIsDomainActive)?.DomainName;

/** An address a service account with this name can get on the organization's custom domain. */
export const getServiceAccountEmail = (name: string, domain: string, number = 1) =>
    `${getServiceAccountEmailLocal(name, number)}@${domain}`;

export const filterServiceAccounts = (accounts: ServiceAccount[], query: string) => {
    const search = query.trim().toLocaleLowerCase();
    return accounts.filter(({ Name, Email }) => `${Name} ${Email}`.toLocaleLowerCase().includes(search));
};
