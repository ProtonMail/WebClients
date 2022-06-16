import { c } from 'ttag';

import useFeature from '../../hooks/useFeature';
import { FeatureCode } from '../features/FeaturesContext';
import FeedbackModal, { FeedbackModalProps } from './FeedbackModal';
import { RebrandingFeatureValue } from './useRebrandingFeedback';

interface RebrandingModalProps extends Partial<FeedbackModalProps> {
    onMount?: () => void;
}

const RebrandingFeedbackModal = (props: RebrandingModalProps) => {
    const rebranding = useFeature<RebrandingFeatureValue>(FeatureCode.RebrandingFeedback);

    const handleSuccess = () => {
        if (rebranding.feature?.Value.completed !== true) {
            /*
             * The value of the rebranding feature is guaranteed to exist here
             * because we're disabling the Feedback Modal until it's available.
             */
            rebranding.update({
                ...rebranding.feature!.Value,
                completed: true,
            });
        }
    };

    if (!rebranding.feature?.Value) {
        return null;
    }

    return (
        <FeedbackModal
            size="medium"
            onSuccess={handleSuccess}
            feedbackType="web_clients_relaunch"
            scaleTitle={c('Label').t`How would you describe your experience with the new Proton?`}
            scaleProps={{
                fromLabel: c('Label').t`Awful`,
                toLabel: c('Label').t`Wonderful`,
            }}
            {...props}
        />
    );
};

export default RebrandingFeedbackModal;
