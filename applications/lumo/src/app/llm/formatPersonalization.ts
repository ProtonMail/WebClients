import { PERSONALITY_OPTIONS, type PersonalizationSettings } from '../redux/slices/personalization';

export function formatPersonalization(personalization: PersonalizationSettings | undefined): string {
    if (!personalization || !personalization.enableForNewChats) {
        return '';
    }

    const parts: string[] = [];

    if (personalization.nickname) {
        parts.push(`Please address me as ${personalization.nickname}.`);
    }

    if (personalization.jobRole) {
        parts.push(`My role/job: ${personalization.jobRole}.`);
    }

    if (personalization.personality !== 'default') {
        const personalityOption = PERSONALITY_OPTIONS.find((p) => p.value === personalization.personality);
        const description = personalityOption?.description;
        if (description) {
            parts.push(`Please adopt a ${description.toLowerCase()} personality.`);
        }
    }

    if (personalization.lumoTraits) {
        parts.push(`Lumo traits: ${personalization.lumoTraits}`);
    }

    if (personalization.additionalContext) {
        parts.push(`Additional context: ${personalization.additionalContext}`);
    }

    return parts.join('\n');
}
