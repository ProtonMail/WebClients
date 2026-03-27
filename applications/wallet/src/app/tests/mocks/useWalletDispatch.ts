import * as useWalletDispatchModule from '@proton/wallet';

export const mockUseWalletDispatch = (mockedValue?: ReturnType<typeof useWalletDispatchModule.useWalletDispatch>) => {
    const spy = vi.spyOn(useWalletDispatchModule, 'useWalletDispatch');

    // @ts-ignore
    spy.mockReturnValue(mockedValue ?? vi.fn());

    return spy;
};
