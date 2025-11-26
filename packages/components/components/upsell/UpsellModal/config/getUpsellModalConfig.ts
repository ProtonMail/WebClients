import { CALENDAR_UPSELL_PATHS, MAIL_UPSELL_PATHS, SHARED_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { getUpsellModalBookingsConfig } from '../configs/getUpsellModalBookingsConfig';
import { getUpsellModalComposerAssistantConfig } from '../configs/getUpsellModalComposerAssistantConfig';
import { getUpsellModalDefaultConfig } from '../configs/getUpsellModalDefaultConfig';
import { getUpsellModalFreeUserConfig } from '../configs/getUpsellModalFreeUserConfig';
import { getUpsellModalProtonSentinelConfig } from '../configs/getUpsellModalProtonSentinelConfig';
import type { UpsellModalConfigParams, UpsellModalConfigResult } from '../interface';

export const getMailUpsellConfig = async (data: UpsellModalConfigParams): Promise<UpsellModalConfigResult> => {
    const isSentinelUpsell = [SHARED_UPSELL_PATHS.SENTINEL, MAIL_UPSELL_PATHS.PROTON_SENTINEL].some((path) =>
        data.upsellRef?.includes(path)
    );
    if (isSentinelUpsell) {
        return getUpsellModalProtonSentinelConfig(data);
    }

    const isComposerAssistantUpsell = data.upsellRef?.includes(MAIL_UPSELL_PATHS.ASSISTANT_COMPOSER);
    if (isComposerAssistantUpsell) {
        return getUpsellModalComposerAssistantConfig(data);
    }
    const isBookingsUpsell = data.upsellRef?.includes(CALENDAR_UPSELL_PATHS.BOOKING_PAGE);
    if (isBookingsUpsell) {
        return getUpsellModalBookingsConfig(data);
    }

    if (data.user.isFree) {
        return getUpsellModalFreeUserConfig(data);
    }

    return getUpsellModalDefaultConfig(data);
};
