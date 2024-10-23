import * as useBitcoinAddressPoolModule from '../../store/hooks/useBitcoinAddressPool';

export const mockUseGetBitcoinAddressPool = (
    mockedValue?: ReturnType<typeof useBitcoinAddressPoolModule.useGetBitcoinAddressPool>
) => {
    const spy = vi.spyOn(useBitcoinAddressPoolModule, 'useGetBitcoinAddressPool');
    spy.mockReturnValue(mockedValue ?? vi.fn());
    return spy;
};
