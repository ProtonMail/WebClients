export const sendFeedback = ({
    Score,
    Feedback,
    FeedbackType,
}: {
    Score: number;
    Feedback: string;
    FeedbackType: string;
}) => ({
    url: `v4/feedback`,
    method: 'post',
    data: { Score, Feedback, FeedbackType },
});
