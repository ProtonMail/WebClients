import { FeatureCode } from '@proton/components';
import { useFeature, useUser } from '@proton/components/hooks';

import useMailModel from 'proton-mail/hooks/useMailModel';

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
    const mailSetting = useMailModel('MailSettings');

    const type: AutoDeleteBannerType = (() => {
        const isFeatureActive = feature?.Value === true;
        if (!isAllowedAutoDeleteLabelID(labelID) || !isFeatureActive || userLoading) {
            return 'hide';
        }

        if (!user.hasPaidMail) {
            return 'free-banner';
        }

        if (isAutoDeleteExplicitlyDisabled(mailSetting)) {
            return 'disabled';
        }

        if (isAutoDeleteNotEnabled(user, mailSetting)) {
            return 'paid-banner';
        }

        if (isAutoDeleteEnabled(user, mailSetting)) {
            return 'enabled';
        }

        return 'hide';
    })();

    return type;
};

export default useAutoDeleteBanner;
