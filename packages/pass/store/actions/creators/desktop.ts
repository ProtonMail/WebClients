import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { RecursivePartial } from '@proton/pass/types/utils';

export const setDesktopSettings = requestActionsFactory<RecursivePartial<ProxiedSettings>, boolean>(
    'desktop-settings::set'
)();
