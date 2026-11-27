import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';

import { getDomainNamesPageAvailability } from './getDomainNamesPageAvailability';

const setUpWithKeys = { RequiresKey: 1, HasKeys: 1 };
const setUpWithoutKeys = { RequiresKey: 0, Name: 'Organization' };
const notSetUp = { RequiresKey: 1, HasKeys: 0 };

const getOrganization = (overrides: Partial<OrganizationExtended> = {}) =>
    ({ State: ORGANIZATION_STATE.ACTIVE, ...setUpWithKeys, ...overrides }) as OrganizationExtended;

const getAvailability = ({
    organization = getOrganization(),
    canReadDomains = true,
}: {
    organization?: OrganizationExtended;
    canReadDomains?: boolean;
}) =>
    getDomainNamesPageAvailability({ organization, permissions: { 'account.domain.read': canReadDomains } })
        .domainNames;

describe('getDomainNamesPageAvailability', () => {
    it('shows the page to a set-up organization with keys', () => {
        expect(getAvailability({})).toBe(true);
    });

    it('shows the page to a set-up organization without keys', () => {
        expect(getAvailability({ organization: getOrganization(setUpWithoutKeys) })).toBe(true);
    });

    it('hides the page from an organization that is not set up', () => {
        expect(getAvailability({ organization: getOrganization(notSetUp) })).toBe(false);
    });

    it('hides the page without an organization', () => {
        expect(
            getDomainNamesPageAvailability({ organization: undefined, permissions: { 'account.domain.read': true } })
                .domainNames
        ).toBe(false);
    });

    it('hides the page without permission to read domains', () => {
        expect(getAvailability({ canReadDomains: false })).toBe(false);
    });
});
