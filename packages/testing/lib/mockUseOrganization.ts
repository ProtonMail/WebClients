import * as useOrganizationModule from '@proton/account/organization/hooks';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces';

jest.mock('@proton/account/organization/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/account/organization/hooks'),
}));

export const mockUseOrganization = (value: [Partial<OrganizationExtended>?, boolean?] = []) => {
    const [organization = {}, cached = false] = value;
    const mockedOrganization = jest.spyOn(useOrganizationModule, 'useOrganization');
    mockedOrganization.mockReturnValue([organization as OrganizationExtended, Boolean(cached)]);
    return mockedOrganization;
};
