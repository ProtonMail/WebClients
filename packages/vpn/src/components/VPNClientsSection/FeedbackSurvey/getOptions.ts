import { c } from 'ttag';

import shuffle from '@proton/utils/shuffle';

import { RAW_SURVEY_OPTIONS } from './rawSurveyOptions';
import type { SurveyOptions } from './surveyOptions';

// ttag can't extract strings from the JSON, so labels and hints are translated here, keyed by their English text
const getTranslations = (): Record<string, string> => ({
    YouTube: c('Info').t`YouTube`,
    TikTok: c('Info').t`TikTok`,
    Instagram: c('Info').t`Instagram`,
    Facebook: c('Info').t`Facebook`,
    Reddit: c('Info').t`Reddit`,
    X: c('Info').t`X`,
    '(formerly Twitter)': c('Info').t`(formerly Twitter)`,
    'Google or other search engine': c('Info').t`Google or other search engine`,
    'Product reviews, rankings, or guides': c('Info').t`Product reviews, rankings, or guides`,
    '(eg. PCMag, TechRadar)': c('Info').t`(eg. PCMag, TechRadar)`,
    'News or media article': c('Info').t`News or media article`,
    '(eg. New York Times, BBC)': c('Info').t`(eg. New York Times, BBC)`,
    Podcast: c('Info').t`Podcast`,
    '(eg. The Vergecast, Big Technology Podcast)': c('Info').t`(eg. The Vergecast, Big Technology Podcast)`,
    'AI chatbot': c('Info').t`AI chatbot`,
    '(eg. ChatGPT, Gemini, Perplexity)': c('Info').t`(eg. ChatGPT, Gemini, Perplexity)`,
    'Friends and family': c('Info').t`Friends and family`,
});

export const getOptions = (): SurveyOptions => {
    const translations = getTranslations();
    const translatedOptions: SurveyOptions = RAW_SURVEY_OPTIONS.map((option) => ({
        ...option,
        label: translations[option.label] ?? option.label,
        hint: option.hint && (translations[option.hint] ?? option.hint),
    }));

    // Shuffled to avoid order bias in the answers, "Other" always stays last
    return [
        ...shuffle(translatedOptions),
        {
            category: 'other',
            label: c('Info').t`Other`,
            value: 'Other',
        },
    ];
};
