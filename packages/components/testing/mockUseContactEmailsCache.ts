import * as useContactEmailsCacheModule from '../containers/contacts/ContactEmailsProvider';

jest.mock('../containers/contacts/ContactEmailsProvider', () => ({
    __esModule: true,
    ...jest.requireActual('../containers/contacts/ContactEmailsProvider'),
}));

export const mockUseContactEmailsCache = (
    value?: Partial<ReturnType<typeof useContactEmailsCacheModule.useContactEmailsCache>>
) => {
    const mockedUseContactEmailsCache = jest.spyOn(useContactEmailsCacheModule, 'useContactEmailsCache');
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
