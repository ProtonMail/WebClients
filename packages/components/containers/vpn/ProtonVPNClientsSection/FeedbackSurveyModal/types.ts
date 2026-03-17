import type { RadioGroupProps } from '@proton/components/components/input/RadioGroup';

export type ChannelCategory = 'social_media' | 'search_content' | 'friends_family' | 'other';

export interface RawFeedbackSurveyOptions {
    value: string;
    content: {
        label: () => string;
        hint?: () => string;
    };
    category: ChannelCategory;
    disabled?: boolean;
}

export type FeedbackSurveyOptions = RadioGroupProps<string>['options'][number] & {
    category: ChannelCategory;
};
