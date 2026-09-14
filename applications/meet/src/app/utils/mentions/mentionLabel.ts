import { EVERYONE_MENTION_ID } from '@proton/meet/utils/mentions/mentionToken';
import clsx from '@proton/utils/clsx';

import { getParticipantDisplayColorsByIdentity } from '../participantDisplayColors/getParticipantDisplayColorsByIdentity';
import { getParticipantDisplayColorsByIndex } from '../participantDisplayColors/getParticipantDisplayColorsByIndex';

export const EVERYONE_MENTION_COLORS = getParticipantDisplayColorsByIndex(2);

export interface MentionLabel {
    /** Display name without the leading `@`. */
    name: string;
    className: string;
}

interface MentionNameOptions {
    everyoneName: string;
    unknownName: string;
}

interface MentionLabelOptions extends MentionNameOptions {
    localIdentity: string;
    localColorIndex: number;
}

/** Resolves a mention's display name; unknown when the participant has left. */
export const getMentionName = (
    id: string,
    participantName: string | undefined,
    { everyoneName, unknownName }: MentionNameOptions
) => (id === EVERYONE_MENTION_ID ? everyoneName : participantName || unknownName);

const getMentionColors = (id: string, { localIdentity, localColorIndex }: MentionLabelOptions) => {
    if (id === EVERYONE_MENTION_ID) {
        return EVERYONE_MENTION_COLORS;
    }

    if (id === localIdentity) {
        return getParticipantDisplayColorsByIndex(localColorIndex);
    }

    return getParticipantDisplayColorsByIdentity(id);
};

/** Display name and styling, shared by the composer and sent messages. */
export const getMentionLabel = (
    id: string,
    participantName: string | undefined,
    options: MentionLabelOptions
): MentionLabel => ({
    name: getMentionName(id, participantName, options),
    className: clsx('text-semibold', getMentionColors(id, options).profileTextColor),
});
