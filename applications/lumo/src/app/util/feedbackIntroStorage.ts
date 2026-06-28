import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from './lumoScopedLocalStorage';

const FEEDBACK_INTRO_KEY = 'lumo-feedback-intro';

type FeedbackIntroState = {
    positiveIntroSeen?: boolean;
    negativeIntroSeen?: boolean;
};

const readFeedbackIntroState = (): FeedbackIntroState => {
    const parsed = readScopedLocalStorageJson<FeedbackIntroState & { seen?: boolean } | null>(
        FEEDBACK_INTRO_KEY,
        {}
    );

    if (!parsed) {
        return {};
    }

    if (parsed.seen === true) {
        return {
            positiveIntroSeen: true,
            negativeIntroSeen: true,
        };
    }

    return parsed;
};

const writeFeedbackIntroState = (update: Partial<FeedbackIntroState>): void => {
    writeScopedLocalStorageJson(FEEDBACK_INTRO_KEY, {
        ...readFeedbackIntroState(),
        ...update,
    });
};

export const hasSeenPositiveFeedbackIntro = (): boolean => {
    return readFeedbackIntroState().positiveIntroSeen === true;
};

export const markPositiveFeedbackIntroSeen = (): void => {
    writeFeedbackIntroState({ positiveIntroSeen: true });
};

export const hasSeenNegativeFeedbackIntro = (): boolean => {
    return readFeedbackIntroState().negativeIntroSeen === true;
};

export const markNegativeFeedbackIntroSeen = (): void => {
    writeFeedbackIntroState({ negativeIntroSeen: true });
};
