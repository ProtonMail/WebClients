import { useUser } from '@proton/components/hooks';
import { FeatureCode, useFeature } from '@proton/features';

const useScheduleSendFeature = () => {
    const featureFlag = useFeature(FeatureCode.ScheduledSendFreemium);
    const [user, userLoading] = useUser();
    const canScheduleSend = featureFlag.feature?.Value === true;
    const canScheduleSendCustom = user.hasPaidMail && canScheduleSend;
    const loading = featureFlag.loading || userLoading;

    return { canScheduleSend, canScheduleSendCustom, loading };
};

export default useScheduleSendFeature;
