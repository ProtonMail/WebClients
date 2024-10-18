import * as useHideAmountsModule from '../../store/hooks/useHideAmounts';

export const mockUseHideAmounts = (mockedValue?: boolean) => {
    const spy = vi.spyOn(useHideAmountsModule, 'useHideAmounts');

    spy.mockReturnValue(mockedValue ?? false);

    return spy;
};
