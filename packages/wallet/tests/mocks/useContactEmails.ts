import * as useContactEmailsModule from '@proton/mail/contactEmails/hooks';

export const mockUseContactEmails = (
    mockedValue?: Partial<ReturnType<typeof useContactEmailsModule.useContactEmails>>
) => {
    const spy = vi.spyOn(useContactEmailsModule, 'useContactEmails');

    spy.mockReturnValue([
        mockedValue?.[0] ?? [
            {
                ID: '99',
                Email: 'test@test.com',
                Name: 'Eric Norbert',
                Type: [],
                Defaults: 0,
                Order: 1,
                ContactID: '99',
                LabelIDs: [],
                LastUsedTime: 0,
            },
        ],
        mockedValue?.[1] ?? false,
    ]);

    return spy;
};
