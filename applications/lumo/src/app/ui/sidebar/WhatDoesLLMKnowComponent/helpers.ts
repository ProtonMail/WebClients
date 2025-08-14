import { ThemeColor } from '@proton/colors/types';

export const DOT_COLOR: { [key: string]: ThemeColor } = {
    certain: ThemeColor.Success,
    likely: ThemeColor.Warning,
    possibly: ThemeColor.Danger,
};

// Arbitrary numbers for now, can change based on llm model, etc
export const MINIMUM_REQUIRED_PROMPTS = 6;
export const MAXIMUM_PROMPTS = 100;

export const extractAndParseJson = (responseText: string) => {
    try {
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : responseText;
        const jsonData = JSON.parse(jsonString);

        // TODO: add json Data validation, may change based on design requirements

        return jsonData;
    } catch (error) {
        throw new Error();
    }
};

export function estimateTokens(text: string) {
    const words = text.split(/\s+/).length;
    return Math.ceil(words * 1.3); // Rough multiplier for tokenization
}

export function truncateContent(text: string | undefined) {
    if (!text) {
        return;
    }

    let tokens = text.split(/\s+/);
    let estimatedTokenCount = estimateTokens(text);

    if (estimatedTokenCount <= 64) {
        return text;
    }

    let firstTokens = tokens.slice(0, 32).join(' ');
    let lastTokens = tokens.slice(-32).join(' ');

    return `${firstTokens} [TRUNCATED] ${lastTokens}`; // More explicit truncation marker
}

// const testReponse = {
//     Age: {
//         value: '20-30',
//         certainty: 'possibly',
//         rationale:
//             "The user's familiarity with modern programming frameworks and technologies suggests a younger adult.",
//     },
//     Education: {
//         value: 'post-secondary',
//         certainty: 'likely',
//         rationale:
//             "The user's technical questions and familiarity with programming concepts suggest a higher level of education.",
//     },
//     Gender: {
//         value: 'male',
//         certainty: 'possibly',
//         rationale:
//             "The user's interests and tone seem more typical of male-dominated fields like programming and technology.",
//     },
//     Interests: {
//         value: ['programming', 'music', 'culture'],
//         certainty: 'likely',
//         rationale:
//             "The user's questions cover a range of topics, including technology, music genres, and national flags.",
//     },
//     Location: {
//         value: 'North America',
//         certainty: 'likely',
//         rationale:
//             'The user mentions Canada and the American flag, suggesting familiarity with North American geography and culture.',
//     },
//     Occupation: {
//         value: 'software developer',
//         certainty: 'likely',
//         rationale: 'The user asks about React, CSS, and JavaScript, indicating a strong interest in web development.',
//     },
//     Relationship_Status: {
//         value: 'single',
//         certainty: 'possibly',
//         rationale:
//             'The user does not mention a partner or family, and their questions do not suggest a strong focus on relationships.',
//     },
//     Voting_Preference: {
//         value: 'neutral',
//         certainty: 'certain',
//         rationale: 'The user does not express any overtly political views or biases in their questions.',
//     },
//     Other: {
//         value: {
//             personality: 'curious',
//             ' tone': 'informal',
//         },
//         certainty: 'likely',
//         rationale: "The user's wide range of questions and casual tone suggest a curious and laid-back personality.",
//     },
// };
