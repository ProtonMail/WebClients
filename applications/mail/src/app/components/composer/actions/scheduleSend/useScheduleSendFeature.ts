import { FeatureCode } from '@proton/components';
import { useFeature, useUser } from '@proton/components/hooks';

const useScheduleSendFeature = () => {
    const featureFlag = useFeature(FeatureCode.ScheduledSendFreemium);
    const [user, userLoading] = useUser();
    const canScheduleSend = featureFlag.feature?.Value === true;
    const canScheduleSendCustom = user.hasPaidMail && canScheduleSend;
    const loading = featureFlag.loading || userLoading;

    return { canScheduleSend, canScheduleSendCustom, loading };
};

export default useScheduleSendFeature;
