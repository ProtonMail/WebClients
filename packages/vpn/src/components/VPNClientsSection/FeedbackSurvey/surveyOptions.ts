interface SurveySubOption {
    name: string;
    value: string;
}

interface SurveyOption {
    value: string;
    label: string;
    hint?: string;
    category: 'social_media' | 'search_content' | 'friends_family' | 'other';
    disabled?: boolean;
    options?: SurveySubOption[];
}

export type SurveyOptions = SurveyOption[];
