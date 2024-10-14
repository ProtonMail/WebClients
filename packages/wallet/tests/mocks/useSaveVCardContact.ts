import * as useSaveVCardContactModule from '@proton/components/containers/contacts/hooks/useSaveVCardContact';

export const mockUseSaveVCardContact = (
    mockedValue?: ReturnType<typeof useSaveVCardContactModule.useSaveVCardContact>
) => {
    const spy = vi.spyOn(useSaveVCardContactModule, 'useSaveVCardContact');

    spy.mockReturnValue(mockedValue ?? vi.fn());

    return spy;
};
