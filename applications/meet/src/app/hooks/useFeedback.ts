import useApi from '@proton/components/hooks/useApi';
import { sendFeedback } from '@proton/shared/lib/api/feedback';

export const useFeedback = () => {
    const api = useApi();

    const submitFeedback = async ({ score, feedbackOptions = [] }: { score: number; feedbackOptions?: string[] }) => {
        const feedback = feedbackOptions.join(', ');

        await api(
            sendFeedback({
                Score: score,
                Feedback: feedback,
                FeedbackType: 'meet_meeting_quality',
            })
        );
    };

    return submitFeedback;
};
