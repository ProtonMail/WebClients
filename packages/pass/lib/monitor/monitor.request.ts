import { api } from '@proton/pass/lib/api/api';
import type { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';

export const sentinelToggle = async (value: SETTINGS_PROTON_SENTINEL_STATE) =>
    api({
        url: `core/v4/settings/highsecurity`,
        method: value ? 'post' : 'delete',
    });
