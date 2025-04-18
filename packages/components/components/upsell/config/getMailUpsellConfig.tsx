import { MAIL_UPSELL_PATHS, SHARED_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { getComposerAssistantUpsellConfig } from './cases/getComposerAssistantUpsellConfig';
import { getDefaultMailUpsellConfig } from './cases/getDefaultMailUpsellConfig';
import { getFreeUserUpsellConfig } from './cases/getFreeUserUpsellConfig';
import { getProtonSentinelUpsellConfig } from './cases/getProtonSentinelUpsellConfig';
import type { GetMailUpsellConfigResult, MailUpsellConfigParams } from './interface';

export const getMailUpsellConfig = async (props: MailUpsellConfigParams): Promise<GetMailUpsellConfigResult> => {
    const { upsellRef, user } = props;
    const isSentinelUpsell = [SHARED_UPSELL_PATHS.SENTINEL, MAIL_UPSELL_PATHS.PROTON_SENTINEL].some((path) =>
        upsellRef?.includes(path)
    );
    const isComposerAssistantUpsell = upsellRef?.includes(MAIL_UPSELL_PATHS.ASSISTANT_COMPOSER);

    if (isComposerAssistantUpsell) {
        return getComposerAssistantUpsellConfig(props);
    } else if (isSentinelUpsell) {
        return getProtonSentinelUpsellConfig(props);
    } else if (user.isFree) {
        return getFreeUserUpsellConfig(props);
    }

    return getDefaultMailUpsellConfig(props);
};
