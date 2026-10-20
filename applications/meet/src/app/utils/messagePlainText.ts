import { replaceMentionTokens } from '@proton/meet/utils/mentions/mentionToken';

import { getLumoEmojiName, splitTextIntoLumoEmojiSegments } from './lumoEmojis/lumoEmojis';
import { getMentionName } from './mentions/mentionLabel';

const ENDS_WITH_LETTER_OR_DIGIT_REGEX = /[\p{L}\p{N}]$/u;
const STARTS_WITH_LETTER_OR_DIGIT_REGEX = /^[\p{L}\p{N}]/u;

interface PlainTextPart {
    text: string;
    isLumoEmojiName: boolean;
}

const needsSpaceBetween = (previousPart: PlainTextPart, part: PlainTextPart) =>
    (previousPart.isLumoEmojiName || part.isLumoEmojiName) &&
    ENDS_WITH_LETTER_OR_DIGIT_REGEX.test(previousPart.text) &&
    STARTS_WITH_LETTER_OR_DIGIT_REGEX.test(part.text);

export const getMessagePlainText = (
    text: string,
    {
        participantNameMap,
        everyoneName,
        unknownName,
    }: { participantNameMap: Record<string, string>; everyoneName: string; unknownName: string }
) => {
    const parts = splitTextIntoLumoEmojiSegments(text).map((segment): PlainTextPart =>
        segment.type === 'lumoEmoji'
            ? { text: getLumoEmojiName(segment.id), isLumoEmojiName: true }
            : {
                  text: replaceMentionTokens(
                      segment.text,
                      (id) => `@${getMentionName(id, participantNameMap[id], { everyoneName, unknownName })}`
                  ),
                  isLumoEmojiName: false,
              }
    );

    return parts
        .map((part, index) => (index > 0 && needsSpaceBetween(parts[index - 1], part) ? ` ${part.text}` : part.text))
        .join('');
};
