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

export interface AssistantFeedback {
    Category: string;
    Sentiment: 'Positive' | 'Negative' | 'Neutral';
    Environment: 'Local' | 'Remote';
    ModelID?: string;
    Component: 'Mail' | 'Lumo';
    Body: string;
    Prompt?: string;
    ModelOutput?: string;
}

export const sendAssistantFeedback = ({
    Category,
    Sentiment,
    Environment,
    ModelID,
    Body,
    Prompt,
    ModelOutput,
    Component,
}: AssistantFeedback) => ({
    url: `ai/v1/feedback`,
    method: 'post',
    data: {
        Category,
        Sentiment,
        Environment,
        ModelID,
        Body,
        Prompt,
        ModelOutput,
        Component,
    },
});
