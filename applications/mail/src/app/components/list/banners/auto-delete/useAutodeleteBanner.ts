import { useUser } from '@proton/account/user/hooks';
import { FeatureCode } from '@proton/features';
import useFeature from '@proton/features/useFeature';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import {
    isAllowedAutoDeleteLabelID,
    isAutoDeleteEnabled,
    isAutoDeleteExplicitlyDisabled,
    isAutoDeleteNotEnabled,
} from '../../../../helpers/autoDelete';

export type AutoDeleteBannerType = 'disabled' | 'enabled' | 'paid-banner' | 'free-banner' | 'hide';

const useAutoDeleteBanner = (labelID: string) => {
    const { feature } = useFeature(FeatureCode.AutoDelete);
    const [user, userLoading] = useUser();
    const [mailSettings] = useMailSettings();

    const type: AutoDeleteBannerType = (() => {
        const isFeatureActive = feature?.Value === true;
        if (!isAllowedAutoDeleteLabelID(labelID) || !isFeatureActive || userLoading) {
            return 'hide';
        }

        if (!user.hasPaidMail) {
            return 'free-banner';
        }

        if (isAutoDeleteExplicitlyDisabled(mailSettings)) {
            return 'disabled';
        }

        if (isAutoDeleteNotEnabled(user, mailSettings)) {
            return 'paid-banner';
        }

        if (isAutoDeleteEnabled(user, mailSettings)) {
            return 'enabled';
        }

        return 'hide';
    })();

    return type;
};

export default useAutoDeleteBanner;
