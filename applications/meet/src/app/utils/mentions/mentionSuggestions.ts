import { EVERYONE_MENTION_ID } from '@proton/meet/utils/mentions/mentionToken';
import { normalize } from '@proton/shared/lib/helpers/string';

export interface MentionSuggestion {
    id: string;
    name: string;
    isEveryone?: boolean;
}

export const getMentionSuggestions = ({
    sortedIdentities,
    participantNameMap,
    localIdentity,
    everyoneName,
}: {
    sortedIdentities: string[];
    participantNameMap: Record<string, string>;
    localIdentity: string;
    everyoneName: string;
}): MentionSuggestion[] => {
    const participants = sortedIdentities
        .filter((identity) => identity !== localIdentity && !!participantNameMap[identity])
        .map((identity) => ({ id: identity, name: participantNameMap[identity] }));

    // Alone in the meeting there is nobody to mention, not even room-wide.
    if (participants.length === 0) {
        return [];
    }

    return [{ id: EVERYONE_MENTION_ID, name: everyoneName, isEveryone: true }, ...participants];
};

const normalizedNames = new Map<string, string>();

const getNormalizedName = (name: string) => {
    const cached = normalizedNames.get(name);

    if (cached !== undefined) {
        return cached;
    }

    const normalized = normalize(name, true);

    normalizedNames.set(name, normalized);

    return normalized;
};

export const filterMentionSuggestions = (suggestions: MentionSuggestion[], query: string): MentionSuggestion[] => {
    // Diacritics are stripped on both sides
    const normalizedQuery = normalize(query, true);

    if (!normalizedQuery) {
        return suggestions;
    }

    // clearing cache if it's too large because of having names of departed participants
    if (normalizedNames.size > suggestions.length * 2) {
        normalizedNames.clear();
    }

    return suggestions.filter(({ name }) => getNormalizedName(name).includes(normalizedQuery));
};
