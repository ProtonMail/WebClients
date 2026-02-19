import { createAction, createReducer } from '@reduxjs/toolkit';
import { c } from 'ttag';

export interface PersonalizationSettings {
    nickname: string;
    jobRole: string;
    personality: 'default' | 'business-cat' | 'sassy-cat' | 'wise-cat' | 'playful-cat' | 'lazy-cat';
    traits: string[];
    lumoTraits: string; // New field for Lumo-specific traits
    additionalContext: string;
    enableForNewChats: boolean; // TODO: I think this is never set to false, hence, unused. Double-check before removing.
}

export interface PersonalizationTrait {
    id: string;
    label: string;
    description?: string;
    sentence: string; // The sentence that gets added to the text area
}

export const AVAILABLE_TRAITS: PersonalizationTrait[] = [
    {
        id: 'chatty',
        label: c('collider_2025: Trait').t`Chatty`,
        description: c('collider_2025: Trait Description').t`Be conversational and engaging in responses`,
        sentence: c('collider_2025: Trait Sentence').t`Be conversational and engaging in your responses.`,
    },
    {
        id: 'witty',
        label: c('collider_2025: Trait').t`Witty`,
        description: c('collider_2025: Trait Description').t`Use clever humor and wordplay when appropriate`,
        sentence: c('collider_2025: Trait Sentence').t`Use clever humor and wordplay when appropriate.`,
    },
    {
        id: 'straight-shooting',
        label: c('collider_2025: Trait').t`Straight shooting`,
        description: c('collider_2025: Trait Description').t`Tell it like it is; don't sugar-coat responses`,
        sentence: c('collider_2025: Trait Sentence').t`Tell it like it is; don't sugar-coat responses.`,
    },
    {
        id: 'encouraging',
        label: c('collider_2025: Trait').t`Encouraging`,
        description: c('collider_2025: Trait Description').t`Be supportive and motivating in your tone`,
        sentence: c('collider_2025: Trait Sentence').t`Be supportive and motivating in your tone.`,
    },
    {
        id: 'gen-z',
        label: c('collider_2025: Trait').t`Gen Z`,
        description: c('collider_2025: Trait Description').t`Use modern slang and trendy communication style`,
        sentence: c('collider_2025: Trait Sentence').t`Use modern slang and trendy communication style.`,
    },
    {
        id: 'traditional',
        label: c('collider_2025: Trait').t`Traditional`,
        description: c('collider_2025: Trait Description').t`Maintain a formal and conventional approach`,
        sentence: c('collider_2025: Trait Sentence').t`Maintain a formal and conventional approach.`,
    },
    {
        id: 'forward-thinking',
        label: c('collider_2025: Trait').t`Forward thinking`,
        description: c('collider_2025: Trait Description').t`Embrace progressive and innovative perspectives`,
        sentence: c('collider_2025: Trait Sentence').t`Embrace progressive and innovative perspectives.`,
    },
    {
        id: 'humble',
        label: c('collider_2025: Trait').t`Humble`,
        description: c('collider_2025: Trait Description').t`Be modest and acknowledge limitations when appropriate`,
        sentence: c('collider_2025: Trait Sentence').t`Be humble when appropriate.`,
    },
];

export const PERSONALITY_OPTIONS = [
    {
        value: 'default',
        label: c('collider_2025: Personality').t`Default`,
        description: c('collider_2025: Personality Description').t`Cheerful and adaptive`,
    },
    {
        value: 'business-cat',
        label: c('collider_2025: Personality').t`Business Cat`,
        description: c('collider_2025: Personality Description').t`Professional but still a cat`,
    },
    {
        value: 'sassy-cat',
        label: c('collider_2025: Personality').t`Sassy Cat`,
        description: c('collider_2025: Personality Description').t`Witty with a bit of attitude`,
    },
    {
        value: 'wise-cat',
        label: c('collider_2025: Personality').t`Wise Cat`,
        description: c('collider_2025: Personality Description').t`Thoughtful and philosophical`,
    },
    {
        value: 'playful-cat',
        label: c('collider_2025: Personality').t`Playful Cat`,
        description: c('collider_2025: Personality Description').t`Energetic and fun-loving`,
    },
    {
        value: 'lazy-cat',
        label: c('collider_2025: Personality').t`Lazy Cat`,
        description: c('collider_2025: Personality Description').t`Chill and laid-back`,
    },
] as const;

const initialState: PersonalizationSettings = {
    nickname: '',
    jobRole: '',
    personality: 'default',
    traits: [],
    lumoTraits: '',
    additionalContext: '',
    enableForNewChats: true,
};

// Actions
export const updatePersonalizationSettings = createAction<Partial<PersonalizationSettings>>(
    'personalization/updateSettings'
);

export const savePersonalizationSettings = createAction<PersonalizationSettings>('personalization/saveSettings');

export const resetPersonalizationSettings = createAction('personalization/resetSettings');

export const toggleTrait = createAction<string>('personalization/toggleTrait');

// Reducer
const personalizationReducer = createReducer(initialState, (builder) => {
    builder
        .addCase(updatePersonalizationSettings, (state, action) => {
            console.log('Personalization reducer: Received updatePersonalizationSettings', action.payload);
            const newState = { ...state, ...action.payload };
            console.log('Personalization reducer: New state', newState);
            return newState;
        })
        .addCase(resetPersonalizationSettings, () => {
            return initialState;
        })
        .addCase(toggleTrait, (state, action) => {
            const traitId = action.payload;
            const currentTraits = state.traits;

            if (currentTraits.includes(traitId)) {
                state.traits = currentTraits.filter((trait) => trait !== traitId);
            } else {
                state.traits = [...currentTraits, traitId];
            }
        });
});

// Helpers
export function isNonEmptyPersonalization(personalization: PersonalizationSettings) {
    const fieldsToCheck: (keyof PersonalizationSettings)[] = [
        'nickname',
        'jobRole',
        'personality',
        'additionalContext',
    ];
    return fieldsToCheck.some((field) => personalization[field] !== initialState[field]);
}

// Export Reducer
export default personalizationReducer;
