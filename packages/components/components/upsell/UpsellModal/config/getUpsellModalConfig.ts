import { MAIL_UPSELL_PATHS, SHARED_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { getUpsellModalComposerAssistantConfig } from '../configs/getUpsellModalComposerAssistantConfig';
import { getUpsellModalDefaultConfig } from '../configs/getUpsellModalDefaultConfig';
import { getUpsellModalFreeUserConfig } from '../configs/getUpsellModalFreeUserConfig';
import { getUpsellModalProtonSentinelConfig } from '../configs/getUpsellModalProtonSentinelConfig';
import type { UpsellModalConfigParams, UpsellModalConfigResult } from '../interface';

export const getMailUpsellConfig = async (data: UpsellModalConfigParams): Promise<UpsellModalConfigResult> => {
    const isSentinelUpsell = [SHARED_UPSELL_PATHS.SENTINEL, MAIL_UPSELL_PATHS.PROTON_SENTINEL].some((path) =>
        data.upsellRef?.includes(path)
    );
    const isComposerAssistantUpsell = data.upsellRef?.includes(MAIL_UPSELL_PATHS.ASSISTANT_COMPOSER);

    if (isComposerAssistantUpsell) {
        return getUpsellModalComposerAssistantConfig(data);
    } else if (isSentinelUpsell) {
        return getUpsellModalProtonSentinelConfig(data);
    } else if (data.user.isFree) {
        return getUpsellModalFreeUserConfig(data);
    }

    return getUpsellModalDefaultConfig(data);
};
