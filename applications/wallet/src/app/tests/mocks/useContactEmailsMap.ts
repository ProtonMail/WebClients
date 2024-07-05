import * as useContactEmailsCacheModule from '@proton/components/containers/contacts/ContactEmailsProvider';

export const mockUseUseContactEmailsMap = (mockedValue?: Partial<useContactEmailsCacheModule.ContactEmailsCache>) => {
    const spy = vi.spyOn(useContactEmailsCacheModule, 'useContactEmailsCache');

    spy.mockReturnValue({
        contactEmails: [],
        contactGroups: [],
        contactEmailsMap: {},
        contactEmailsMapWithDuplicates: {},
        groupsWithContactsMap: {},
        ...mockedValue,
    });

    return spy;
};
