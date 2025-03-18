import * as useLocalSettingsModule from '../../store/hooks/useLocalSettings';
import { WalletThemeOption } from '../../utils/theme';

export const mockUseLocalSettings = (mockedValue?: Partial<ReturnType<typeof useLocalSettingsModule.useSettings>>) => {
    const spy = vi.spyOn(useLocalSettingsModule, 'useSettings');

    spy.mockReturnValue([mockedValue?.[0] ?? { theme: WalletThemeOption.WalletLight }, mockedValue?.[1] ?? false]);

    return spy;
};
