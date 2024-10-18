import type { DesktopSettingsDTO } from '@proton/pass/lib/desktop-settings/types';
import { desktopSettingsSetRequest, desktopSettingsSyncRequest } from '@proton/pass/store/actions/requests';
import type { DesktopSettingsState } from '@proton/pass/store/reducers/desktop-settings';
import { requestActionsFactory } from '@proton/pass/store/request/flow';

export const setDesktopSettings = requestActionsFactory<DesktopSettingsDTO, DesktopSettingsDTO>(
    'desktop-settings::set'
)({
    requestId: desktopSettingsSetRequest,
});

export const syncDesktopSettings = requestActionsFactory<void, DesktopSettingsState>('desktop-settings::sync')({
    requestId: desktopSettingsSyncRequest,
});
