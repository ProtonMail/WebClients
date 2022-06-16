import useFeature from '../../hooks/useFeature';
import useUserSettings from '../../hooks/useUserSettings';
import { FeatureCode } from '../features';

const useHasRebrandingFeedback = () => {
    const [{ Locale }] = useUserSettings();

    const rebrandingFeedbackEnabled = useFeature(FeatureCode.RebrandingFeedbackEnabled);

    const rebrandingFeedbackFeatureIsEnabled = Boolean(rebrandingFeedbackEnabled.feature?.Value);
    const isEnglishUser = Locale?.startsWith('en_');

    return rebrandingFeedbackFeatureIsEnabled && isEnglishUser;
};

export default useHasRebrandingFeedback;
