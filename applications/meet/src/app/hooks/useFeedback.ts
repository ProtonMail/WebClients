import useApi from '@proton/components/hooks/useApi';
import { sendFeedback } from '@proton/shared/lib/api/meet';

export const useFeedback = () => {
    const api = useApi();

    const submitFeedback = async ({
        meetingLinkName,
        score,
        feedbackOptions = [],
    }: {
        meetingLinkName: string;
        score: number;
        feedbackOptions?: string[];
    }) => {
        const feedback = feedbackOptions.join(', ');

        await api(
            sendFeedback(meetingLinkName, {
                Score: score,
                Feedback: feedback,
            })
        );
    };

    return submitFeedback;
};
