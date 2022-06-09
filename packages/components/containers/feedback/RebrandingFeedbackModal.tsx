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
            description={c('new_plans: info')
                .t`We've introduced Proton's unified & refreshed look. We would love to hear what you think about it!`}
            scaleTitle={c('new_plans: label').t`How would you describe your experience with the new Proton?`}
            scaleProps={{
                from: 0,
                to: 5,
                fromLabel: c('new_plans: label').t`0 - Awful`,
                toLabel: c('new_plans: label').t`5 - Wonderful`,
            }}
            {...props}
        />
    );
};

export default RebrandingFeedbackModal;
