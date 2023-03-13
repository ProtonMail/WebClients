export const sendFeedback = ({
    Score,
    Feedback,
    FeedbackType,
}: {
    Score: number;
    Feedback: string;
    FeedbackType: string;
}) => ({
    url: `core/v4/feedback`,
    method: 'post',
    data: { Score, Feedback, FeedbackType },
});
