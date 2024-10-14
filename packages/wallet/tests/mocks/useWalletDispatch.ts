import * as useWalletDispatchModule from '../../store/hooks/app';

type MockedDispatch = ReturnType<typeof useWalletDispatchModule.useWalletDispatch>;

export const mockUseWalletDispatch = (mockedValue?: MockedDispatch) => {
    const spy = vi.spyOn(useWalletDispatchModule, 'useWalletDispatch');

    const dispatch = mockedValue ?? vi.fn();

    spy.mockReturnValue(dispatch as MockedDispatch);

    return spy;
};
