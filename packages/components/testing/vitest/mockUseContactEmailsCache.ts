import { vi } from 'vitest';

import * as useContactEmailsCacheModule from '../../containers/contacts/ContactEmailsProvider';

vi.mock('../../containers/contacts/ContactEmailsProvider', async () => ({
    __esModule: true,
    ...(await vi.importActual('../../containers/contacts/ContactEmailsProvider')),
}));

export const mockUseContactEmailsCache = (
    value?: Partial<ReturnType<typeof useContactEmailsCacheModule.useContactEmailsCache>>
) => {
    const mockedUseContactEmailsCache = vi.spyOn(useContactEmailsCacheModule, 'useContactEmailsCache');
    mockedUseContactEmailsCache.mockReturnValue({
        contactEmails: [],
        contactGroups: [],
        contactEmailsMap: {},
        contactEmailsMapWithDuplicates: {},
        groupsWithContactsMap: {},
        ...value,
    });

    return mockedUseContactEmailsCache;
};
