import { c } from 'ttag';

import useFeature from '../../hooks/useFeature';
import { FeatureCode } from '../features/FeaturesContext';
import FeedbackModal, { FeedbackModalProps } from './FeedbackModal';

const RebrandingFeedbackModal = (props: Partial<FeedbackModalProps>) => {
    const hasGivenRebrandingFeedback = useFeature(FeatureCode.HasGivenRebrandingFeedback);

    const handleSuccess = () => {
        hasGivenRebrandingFeedback.update(true);
    };

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
