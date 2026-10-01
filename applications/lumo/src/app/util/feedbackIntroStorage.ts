import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from './lumoScopedLocalStorage';

const FEEDBACK_INTRO_KEY = 'lumo-feedback-intro';
const POSITIVE_INTRO_VERSION = 'v1';
const NEGATIVE_INTRO_VERSION = 'v2';

type FeedbackIntroState = {
    positiveIntroVersionSeen?: string;
    negativeIntroVersionSeen?: string;
};

const readFeedbackIntroState = (): FeedbackIntroState => {
    const parsed = readScopedLocalStorageJson<(FeedbackIntroState & { seen?: boolean }) | null>(FEEDBACK_INTRO_KEY, {});

    if (!parsed) {
        return {};
    }

    // Migrate the legacy `seen` flag into the versioned positive-intro state only: its copy is unchanged, so
    // previously-seen users shouldn't see it again. The negative intro's copy did change, so its legacy state is
    // deliberately left unmigrated.
    const legacy = parsed as FeedbackIntroState & { seen?: boolean; positiveIntroSeen?: boolean };
    if (!parsed.positiveIntroVersionSeen && (legacy.seen === true || legacy.positiveIntroSeen === true)) {
        parsed.positiveIntroVersionSeen = POSITIVE_INTRO_VERSION;
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
    return readFeedbackIntroState().positiveIntroVersionSeen === POSITIVE_INTRO_VERSION;
};

export const markPositiveFeedbackIntroSeen = (): void => {
    writeFeedbackIntroState({ positiveIntroVersionSeen: POSITIVE_INTRO_VERSION });
};

export const hasSeenNegativeFeedbackIntro = (): boolean => {
    return readFeedbackIntroState().negativeIntroVersionSeen === NEGATIVE_INTRO_VERSION;
};

export const markNegativeFeedbackIntroSeen = (): void => {
    writeFeedbackIntroState({ negativeIntroVersionSeen: NEGATIVE_INTRO_VERSION });
};
