import type { OrganizationExtended } from '@proton/shared/lib/interfaces';

import * as useOrganizationModule from '../organization/hooks';

jest.mock('../organization/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('../organization/hooks'),
}));

export const mockUseOrganization = (value: [Partial<OrganizationExtended>?, boolean?] = []) => {
    const [organization = {}, cached = false] = value;
    const mockedOrganization = jest.spyOn(useOrganizationModule, 'useOrganization');
    mockedOrganization.mockReturnValue([organization as OrganizationExtended, Boolean(cached)]);
    return mockedOrganization;
};
