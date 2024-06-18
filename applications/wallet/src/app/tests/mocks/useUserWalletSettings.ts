import { userWalletSettings } from '@proton/wallet';

import * as useUserWalletSettingsModule from '../../store/hooks/useUserWalletSettings';

export const mockUseUserWalletSettings = (
    mockedValue?: ReturnType<typeof useUserWalletSettingsModule.useUserWalletSettings>
) => {
    const spy = vi.spyOn(useUserWalletSettingsModule, 'useUserWalletSettings');

    spy.mockReturnValue([mockedValue ? mockedValue[0] : userWalletSettings, mockedValue?.[1] ?? false]);

    return spy;
};
