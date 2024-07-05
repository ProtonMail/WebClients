import * as useUserWalletSettingsModule from '../../store/hooks/useUserWalletSettings';
import { userWalletSettings } from '../fixtures/api';

export const mockUseUserWalletSettings = (
    mockedValue?: ReturnType<typeof useUserWalletSettingsModule.useUserWalletSettings>
) => {
    const spy = vi.spyOn(useUserWalletSettingsModule, 'useUserWalletSettings');

    spy.mockReturnValue([mockedValue ? mockedValue[0] : userWalletSettings, mockedValue?.[1] ?? false]);

    return spy;
};

export const mockUseGetUserWalletSettings = (
    mockedValue: () => Promise<typeof userWalletSettings> = async () => userWalletSettings
) => {
    const spy = vi.spyOn(useUserWalletSettingsModule, 'useGetUserWalletSettings');
    spy.mockReturnValue(mockedValue ?? vi.fn(async () => userWalletSettings));
    return spy;
};
