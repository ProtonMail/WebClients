export const EVERYONE_MENTION_ID = 'everyone';

// Module-local to avoid non-deterministic global regex state.
const MENTION_TOKEN_REGEX =
    /\[participant_uuid:(everyone|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]/g;

export const getMentionToken = (id: string) => `[participant_uuid:${id}]`;

export const replaceMentionTokens = (message: string, replaceToken: (id: string) => string) =>
    message.replace(MENTION_TOKEN_REGEX, (_token, id: string) => replaceToken(id));

export type MentionSegment = { type: 'text'; text: string } | { type: 'mention'; id: string };

export const splitMessageIntoMentionSegments = (message: string): MentionSegment[] => {
    const segments: MentionSegment[] = [];

    let lastIndex = 0;

    for (const match of message.matchAll(MENTION_TOKEN_REGEX)) {
        if (match.index > lastIndex) {
            segments.push({ type: 'text', text: message.slice(lastIndex, match.index) });
        }

        segments.push({ type: 'mention', id: match[1] });

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < message.length) {
        segments.push({ type: 'text', text: message.slice(lastIndex) });
    }

    return segments;
};

export const isParticipantMentioned = (message: string, identity: string) =>
    splitMessageIntoMentionSegments(message).some(
        (segment) => segment.type === 'mention' && (segment.id === EVERYONE_MENTION_ID || segment.id === identity)
    );
