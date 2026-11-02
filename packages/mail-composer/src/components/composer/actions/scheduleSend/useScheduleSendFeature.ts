import { useUser } from '@proton/account/user/hooks';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';

const useScheduleSendFeature = () => {
    const featureFlag = useFeature(FeatureCode.ScheduledSendFreemium);
    const [user, userLoading] = useUser();
    const canScheduleSend = featureFlag.feature?.Value === true;
    const canScheduleSendCustom = user.hasPaidMail && canScheduleSend;
    const loading = featureFlag.loading || userLoading;

    return { canScheduleSend, canScheduleSendCustom, loading };
};

export default useScheduleSendFeature;
