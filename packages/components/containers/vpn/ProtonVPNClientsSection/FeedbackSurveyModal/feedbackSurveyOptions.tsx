import { c } from 'ttag';

import shuffle from '@proton/utils/shuffle';

import type { RawFeedbackSurveyOptions } from './types';

const stringFeedbackSurveyOptions: RawFeedbackSurveyOptions[] = [
    {
        value: 'YouTube',
        content: { label: () => c('Info').t`YouTube` },
        disabled: false,
        category: 'social_media',
    },
    {
        value: 'TikTok',
        content: { label: () => c('Info').t`TikTok` },
        disabled: false,
        category: 'social_media',
    },
    {
        value: 'Instagram',
        content: { label: () => c('Info').t`Instagram` },
        disabled: false,
        category: 'social_media',
    },
    {
        value: 'Facebook',
        content: { label: () => c('Info').t`Facebook` },
        disabled: false,
        category: 'social_media',
    },
    {
        value: 'Reddit',
        content: { label: () => c('Info').t`Reddit` },
        disabled: false,
        category: 'social_media',
    },
    {
        value: 'X',
        content: { label: () => c('Info').t`X`, hint: () => c('Info').t`(formerly Twitter)` },
        disabled: false,
        category: 'social_media',
    },
    {
        value: 'Google or other search engine',
        content: { label: () => c('Info').t`Google or other search engine` },
        disabled: false,
        category: 'search_content',
    },
    {
        value: 'Product reviews, rankings, or guides',
        content: {
            label: () => c('Info').t`Product reviews, rankings, or guides`,
            hint: () => c('Info').t`(eg. PCMag, TechRadar)`,
        },
        disabled: false,
        category: 'search_content',
    },
    {
        value: 'News or media article',
        content: {
            label: () => c('Info').t`News or media article`,
            hint: () => c('Info').t`(eg. New York Times, BBC)`,
        },
        disabled: false,
        category: 'search_content',
    },
    {
        value: 'Podcast',
        content: {
            label: () => c('Info').t`Podcast`,
            hint: () => c('Info').t`(eg. The Vergecast, Big Technology Podcast)`,
        },
        disabled: false,
        category: 'search_content',
    },
    {
        value: 'AI chatbot',
        content: { label: () => c('Info').t`AI chatbot`, hint: () => c('Info').t`(eg. ChatGPT, Gemini, Perplexity)` },
        disabled: false,
        category: 'social_media',
    },
    {
        value: 'Friends and family',
        content: { label: () => c('Info').t`Friends and family` },
        disabled: false,
        category: 'other',
    },
];

export const getFeedbackSurveyOptions = (): RawFeedbackSurveyOptions[] => [
    ...shuffle(stringFeedbackSurveyOptions),
    {
        value: 'Other',
        content: { label: () => c('Info').t`Other` },
        disabled: false,
        category: 'other',
    },
];
