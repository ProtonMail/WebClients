import { FeatureCode } from '@proton/components/containers';
import { useFeature, useMailSettings, useUser } from '@proton/components/hooks';

import { isAllowedAutoDeleteLabelID } from '../../../helpers/autoDelete';
import { AutoDeleteBannerType } from './interface';

const useAutoDeleteBanner = (labelID: string) => {
    const { feature } = useFeature(FeatureCode.AutoDelete);
    const [user, userLoading] = useUser();
    const [mailSetting, mailSettingsLoading] = useMailSettings();

    const type: AutoDeleteBannerType = (() => {
        if (!isAllowedAutoDeleteLabelID(labelID) || feature?.Value === false || userLoading || mailSettingsLoading) {
            return 'hide';
        }

        if (!user.hasPaidMail) {
            return 'free-banner';
        }

        // User explicitly disabled
        if (mailSetting?.AutoDeleteSpamAndTrashDays === 0) {
            return 'disabled';
        }

        // User has not enabled yet
        if (user.hasPaidMail && mailSetting?.AutoDeleteSpamAndTrashDays === null) {
            return 'paid-banner';
        }

        if (
            user.hasPaidMail &&
            mailSetting?.AutoDeleteSpamAndTrashDays &&
            mailSetting?.AutoDeleteSpamAndTrashDays > 0
        ) {
            return 'enabled';
        }

        return 'hide';
    })();

    return type;
};

export default useAutoDeleteBanner;
