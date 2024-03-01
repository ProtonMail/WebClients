import * as useWalletDispatchModule from '../../store/hooks';

export const mockUseWalletDispatch = (mockedValue?: ReturnType<typeof useWalletDispatchModule.useWalletDispatch>) => {
    const spy = vi.spyOn(useWalletDispatchModule, 'useWalletDispatch');
    spy.mockReturnValue(mockedValue ?? vi.fn);

    return spy;
};
