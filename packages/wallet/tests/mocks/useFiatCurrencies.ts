import * as useFiatCurrenciesModule from '../../store/hooks/useFiatCurrencies';

export const mockUseFiatCurrencies = (
    mockedValue?: Partial<ReturnType<typeof useFiatCurrenciesModule.useFiatCurrencies>>
) => {
    const spy = vi.spyOn(useFiatCurrenciesModule, 'useFiatCurrencies');

    spy.mockReturnValue([mockedValue?.[0] ?? [], mockedValue?.[1] ?? false]);

    return spy;
};
