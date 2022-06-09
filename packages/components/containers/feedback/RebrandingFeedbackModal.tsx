import { c } from 'ttag';

import useFeature from '../../hooks/useFeature';
import { FeatureCode } from '../features/FeaturesContext';
import FeedbackModal, { FeedbackModalProps } from './FeedbackModal';
import { RebrandingFeatureValue } from './useRebrandingFeedback';

const RebrandingFeedbackModal = (props: Partial<FeedbackModalProps>) => {
    const rebranding = useFeature<RebrandingFeatureValue>(FeatureCode.RebrandingFeedback);

    const handleSuccess = () => {
        /*
         * The value of the rebranding feature is guaranteed to exist here
         * because we're disabling the Feedback Modal until it's available.
         */
        rebranding.update({
            ...rebranding.feature!.Value,
            hasGivenRebrandingFeedback: true,
        });
    };

    if (!rebranding.feature?.Value) {
        return null;
    }

    return (
        <FeedbackModal
            size="medium"
            onSuccess={handleSuccess}
            feedbackType="rebrand_web"
            scaleTitle={c('Label').t`How would you describe your experience with the new Proton?`}
            scaleProps={{
                from: 1,
                to: 5,
                fromLabel: c('Label').t`1 - Awful`,
                toLabel: c('Label').t`5 - Wonderful`,
            }}
            {...props}
        />
    );
};

export default RebrandingFeedbackModal;
