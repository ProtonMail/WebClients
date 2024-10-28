import * as useGetRecipientVerifiedAddressKeyModule from '../../hooks/useGetRecipientVerifiedAddressKey';

export const mockUseGetRecipientVerifiedAddressKey = (
    mockedValue?: ReturnType<typeof useGetRecipientVerifiedAddressKeyModule.useGetRecipientVerifiedAddressKey>
) => {
    const spy = vi.spyOn(useGetRecipientVerifiedAddressKeyModule, 'useGetRecipientVerifiedAddressKey');
    spy.mockReturnValue(mockedValue ?? vi.fn());
    return spy;
};
