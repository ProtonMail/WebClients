import { FeatureCode } from '@proton/components/containers';
import { useFeature, useUser } from '@proton/components/hooks';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { isAllowedAutoDeleteLabelID } from '../../../../helpers/autoDelete';

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

        // User explicitly disabled
        if (mailSetting.AutoDeleteSpamAndTrashDays === AUTO_DELETE_SPAM_AND_TRASH_DAYS.DISABLED) {
            return 'disabled';
        }

        // User has not enabled yet
        if (user.hasPaidMail && mailSetting.AutoDeleteSpamAndTrashDays === null) {
            return 'paid-banner';
        }

        if (
            user.hasPaidMail &&
            mailSetting.AutoDeleteSpamAndTrashDays &&
            mailSetting.AutoDeleteSpamAndTrashDays > AUTO_DELETE_SPAM_AND_TRASH_DAYS.DISABLED
        ) {
            return 'enabled';
        }

        return 'hide';
    })();

    return type;
};

export default useAutoDeleteBanner;
