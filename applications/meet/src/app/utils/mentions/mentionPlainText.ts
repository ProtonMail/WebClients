import { replaceMentionTokens } from '@proton/meet/utils/mentions/mentionToken';

import { getMentionName } from './mentionLabel';

export const getMentionPlainText = (
    text: string,
    {
        participantNameMap,
        everyoneName,
        unknownName,
    }: { participantNameMap: Record<string, string>; everyoneName: string; unknownName: string }
) =>
    replaceMentionTokens(text, (id) => `@${getMentionName(id, participantNameMap[id], { everyoneName, unknownName })}`);
