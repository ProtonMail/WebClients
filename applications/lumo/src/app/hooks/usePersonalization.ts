import { useLumoSelector } from '../redux/hooks';

export const usePersonalization = () => {
    const personalization = useLumoSelector((state) => state.personalization);

    const hasPersonalization = !!(
        personalization.nickname ||
        personalization.jobRole ||
        personalization.personality !== 'default' ||
        personalization.traits.length > 0 ||
        personalization.lumoTraits ||
        personalization.additionalContext
    );

    const getPersonalizationPrompt = (): string => {
        if (!hasPersonalization || !personalization.enableForNewChats) {
            return '';
        }

        const parts: string[] = [];

        if (personalization.nickname) {
            parts.push(`Call me ${personalization.nickname}.`);
        }

        if (personalization.jobRole) {
            parts.push(`I work as: ${personalization.jobRole}`);
        }

        if (personalization.personality !== 'default') {
            const personalityMap = {
                'business-cat': 'professional yet feline personality - think of yourself as a sophisticated cat in a business suit',
                'sassy-cat': 'sassy and witty personality with a bit of feline attitude',
                'wise-cat': 'wise and philosophical personality, like an old sage cat',
                'playful-cat': 'playful and energetic personality, like a kitten full of curiosity',
                'lazy-cat': 'chill and laid-back personality, like a cat who loves to nap in sunny spots'
            };
            const description = personalityMap[personalization.personality as keyof typeof personalityMap];
            if (description) {
                parts.push(`Please adopt a ${description}.`);
            }
        }

        if (personalization.traits.length > 0) {
            parts.push(`Communication style: ${personalization.traits.join(', ')}.`);
        }

        if (personalization.lumoTraits) {
            parts.push(`Lumo traits: ${personalization.lumoTraits}`);
        }

        if (personalization.additionalContext) {
            parts.push(`Additional context: ${personalization.additionalContext}`);
        }

        return parts.join(' ');
    };

    return {
        personalization,
        hasPersonalization,
        getPersonalizationPrompt,
    };
};

export default usePersonalization;
