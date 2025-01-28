import * as useContactEmailsCacheModule from '@proton/components/containers/contacts/ContactEmailsProvider';

jest.mock('@proton/components/containers/contacts/ContactEmailsProvider', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/components/containers/contacts/ContactEmailsProvider'),
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
