import { MAIL_UPSELL_PATHS, SHARED_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { getUpsellModalComposerAssistantConfig } from '../configs/getUpsellModalComposerAssistantConfig';
import { getUpsellModalDefaultConfig } from '../configs/getUpsellModalDefaultConfig';
import { getUpsellModalFreeUserConfig } from '../configs/getUpsellModalFreeUserConfig';
import { getUpsellModalProtonSentinelConfig } from '../configs/getUpsellModalProtonSentinelConfig';
import type { UpsellModalConfigParams, UpsellModalConfigResult } from '../interface';

export const getMailUpsellConfig = async (props: UpsellModalConfigParams): Promise<UpsellModalConfigResult> => {
    const { upsellRef, user } = props;
    const isSentinelUpsell = [SHARED_UPSELL_PATHS.SENTINEL, MAIL_UPSELL_PATHS.PROTON_SENTINEL].some((path) =>
        upsellRef?.includes(path)
    );
    const isComposerAssistantUpsell = upsellRef?.includes(MAIL_UPSELL_PATHS.ASSISTANT_COMPOSER);

    if (isComposerAssistantUpsell) {
        return getUpsellModalComposerAssistantConfig(props);
    } else if (isSentinelUpsell) {
        return getUpsellModalProtonSentinelConfig(props);
    } else if (user.isFree) {
        return getUpsellModalFreeUserConfig(props);
    }

    return getUpsellModalDefaultConfig(props);
};
